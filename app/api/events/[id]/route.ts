import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateMeetingLink } from "@/lib/meetings";
import { normalizeSessions } from "@/lib/sessions";
import { syncEventFromSessions, eventSessions } from "@/lib/queries";
import { visibilityFields } from "@/lib/visibility";
import { uid } from "@/lib/format";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const canManage = user.role === "admin" || (user.role === "trainer" && event.trainerId === user.id);
  if (!canManage) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const body = await req.json();
  const action = body.action as string | undefined;

  if (action === "cancel") {
    event.status = "cancelled";
    db.notifications.unshift({
      id: uid("nt"), to: "trainees",
      title: `Cancelled: ${event.title}`,
      body: `The programme starting ${event.date} has been cancelled. Registered participants will receive an updated calendar invitation.`,
      kind: "event", at: new Date().toISOString(), readBy: [],
    });
    audit(db, user.name, "event.cancelled", event.title);
  } else if (action === "publish") {
    event.status = "published";
    // Provision meeting links for every online session that lacks one.
    event.sessions = eventSessions(event).map((s) =>
      s.platform !== "Physical Meeting" && !s.meetingLink
        ? { ...s, meetingLink: generateMeetingLink(s.platform, event.title) }
        : s,
    );
    syncEventFromSessions(event);
    db.notifications.unshift({
      id: uid("nt"), to: "trainees",
      title: `New training: ${event.title}`,
      body: `A programme with ${event.sessions.length} session${event.sessions.length === 1 ? "" : "s"} is open for registration, starting ${event.date}.`,
      kind: "event", at: new Date().toISOString(), readBy: [],
    });
    audit(db, user.name, "event.published", event.title);
  } else if (action === "complete") {
    event.status = "completed";
    audit(db, user.name, "event.completed", event.title);
  } else if (action === "duplicate") {
    const copy = {
      ...event,
      id: uid("ev"),
      title: `${event.title} (Copy)`,
      status: "draft" as const,
      sessions: eventSessions(event).map((s) => ({ ...s, id: uid("ss"), meetingLink: "" })),
      createdAt: new Date().toISOString(),
    };
    syncEventFromSessions(copy);
    db.events.push(copy);
    audit(db, user.name, "event.duplicated", event.title);
    await saveDb(db);
    return NextResponse.json({ ok: true, id: copy.id });
  } else {
    // Field edit
    const editable = ["title", "description", "category", "timeZone", "maxParticipants", "materials", "agenda", "prerequisites", "instructions", "reminder", "repeat", "validFrom", "validUntil", "status"];
    for (const k of editable) {
      if (k in body) (event as any)[k] = body[k];
    }
    if ("visibleBatches" in body) {
      const { visibility, visibleBatches } = visibilityFields(body, db.settings.batches);
      event.visibility = visibility;
      event.visibleBatches = visibleBatches;
    }
    event.maxParticipants = Number(event.maxParticipants) || 25;
    const trainerIds = new Set(db.users.filter((u) => u.role === "trainer").map((u) => u.id));
    if (user.role === "admin" && body.trainerId && trainerIds.has(body.trainerId)) {
      event.trainerId = body.trainerId;
    }
    if (user.role === "admin") {
      if (typeof body.allowTrainerSessions === "boolean") event.allowTrainerSessions = body.allowTrainerSessions;
      if (Array.isArray(body.assignedTrainerIds)) {
        event.assignedTrainerIds = body.assignedTrainerIds.filter((tid: string) => trainerIds.has(tid));
      }
    }
    if ("sessions" in body) {
      if (user.role === "trainer" && db.settings.trainersCanManageSessions === false) {
        return NextResponse.json({ error: "The administrator currently manages sessions. Please contact L&D to change the schedule." }, { status: 403 });
      }
      const allowedSessionTrainers = user.role === "admin" ? trainerIds : new Set([user.id]);
      const sessions = normalizeSessions(body.sessions, event.title, event.status === "published", event.trainerId, allowedSessionTrainers, event.category || db.settings.categories[0]);
      const canBeEmpty = user.role === "admin" && event.allowTrainerSessions && (event.assignedTrainerIds ?? []).length;
      if (!sessions && !canBeEmpty) {
        return NextResponse.json({ error: "Add at least one session with a date, start and end time." }, { status: 400 });
      }
      event.sessions = sessions ?? [];
    }
    syncEventFromSessions(event);
    audit(db, user.name, "event.updated", event.title);
  }

  await saveDb(db);
  return NextResponse.json({ ok: true, id: event.id });
}
