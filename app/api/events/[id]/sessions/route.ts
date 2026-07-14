import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { normalizeSessions } from "@/lib/sessions";
import { syncEventFromSessions } from "@/lib/queries";
import { uid } from "@/lib/format";

// Who may add sessions to this event.
function canAddSession(event: any, user: any): boolean {
  if (user.role === "admin") return true;
  if (user.role !== "trainer") return false;
  if (event.trainerId === user.id) return true; // owner
  return Boolean(event.allowTrainerSessions) && (event.assignedTrainerIds ?? []).includes(user.id);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!canAddSession(event, user)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const body = await req.json();
  // A trainer's added session is always assigned to themselves; admins can pick.
  const trainerIds = new Set(db.users.filter((u) => u.role === "trainer").map((u) => u.id));
  const forcedTrainer = user.role === "admin" ? undefined : user.id;
  const one = normalizeSessions(
    [{ ...body, trainerId: forcedTrainer ?? body.trainerId }],
    event.title,
    event.status === "published",
    forcedTrainer ?? event.trainerId,
    user.role === "admin" ? trainerIds : new Set([user.id]),
    event.category || db.settings.categories[0],
  );
  if (!one) return NextResponse.json({ error: "A session needs a date, start and end time." }, { status: 400 });

  event.sessions = [...(event.sessions ?? []), one[0]];
  syncEventFromSessions(event);
  audit(db, user.name, "session.added", `${event.title} — ${one[0].name}`);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const { sessionId } = await req.json();
  const session = (event.sessions ?? []).find((s) => s.id === sessionId);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Admin/owner can delete any session; a trainer can delete only their own.
  const isOwnerOrAdmin = user.role === "admin" || event.trainerId === user.id;
  if (!isOwnerOrAdmin && session.trainerId !== user.id) {
    return NextResponse.json({ error: "You can only remove your own sessions." }, { status: 403 });
  }
  if ((event.sessions ?? []).length <= 1) {
    return NextResponse.json({ error: "An event must keep at least one session. Cancel the event instead." }, { status: 400 });
  }

  event.sessions = (event.sessions ?? []).filter((s) => s.id !== sessionId);
  syncEventFromSessions(event);
  audit(db, user.name, "session.removed", `${event.title} — ${session.name}`);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
