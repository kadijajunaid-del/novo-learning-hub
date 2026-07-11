import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const { userId, attended } = await req.json();
  const reg = db.registrations.find((r) => r.eventId === id && r.userId === userId);
  if (!reg) return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  reg.attended = attended === null ? null : Boolean(attended);
  audit(db, user.name, "attendance.updated", event.title);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
