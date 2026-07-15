import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { normalizeSessions } from "@/lib/sessions";
import { syncEventFromSessions } from "@/lib/queries";
import { visibilityFields } from "@/lib/visibility";
import { uid } from "@/lib/format";
import type { TrainingEvent } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const body = await req.json();
  const db = await getDb();

  if (user.role === "trainer" && db.settings.trainersCanManageSessions === false) {
    return NextResponse.json({ error: "The administrator currently manages events and sessions. Please contact L&D to schedule your training." }, { status: 403 });
  }

  const status = body.status === "published" ? "published" : "draft";
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  // Admins can assign the event (and each session) to any trainer.
  const trainerIds = new Set(db.users.filter((u) => u.role === "trainer").map((u) => u.id));
  let trainerId = user.id;
  if (user.role === "admin" && body.trainerId && trainerIds.has(body.trainerId)) {
    trainerId = body.trainerId;
  }
  const allowedSessionTrainers = user.role === "admin" ? trainerIds : new Set([user.id]);

  // Collaborative events: admin lets assigned trainers add sessions later.
  const allowTrainerSessions = user.role === "admin" && Boolean(body.allowTrainerSessions);
  const assignedTrainerIds = allowTrainerSessions && Array.isArray(body.assignedTrainerIds)
    ? body.assignedTrainerIds.filter((tid: string) => trainerIds.has(tid))
    : [];

  const sessions = normalizeSessions(body.sessions, title, status === "published", trainerId, allowedSessionTrainers, body.category || db.settings.categories[0]);
  // Sessions are required unless assigned trainers will add them.
  if (!sessions && !(allowTrainerSessions && assignedTrainerIds.length)) {
    return NextResponse.json({ error: "Add at least one session with a date, start and end time — or enable trainer sessions and assign trainers." }, { status: 400 });
  }

  const event: TrainingEvent = {
    id: uid("ev"),
    title,
    description: String(body.description ?? ""),
    trainerId,
    category: body.category || "Onboarding",
    sessions: sessions ?? [],
    date: "", startTime: "", endTime: "", platform: "Microsoft Teams", venue: "", meetingLink: "",
    timeZone: body.timeZone || "Europe/Copenhagen",
    maxParticipants: Number(body.maxParticipants) || 25,
    materials: Array.isArray(body.materials) ? body.materials : [],
    agenda: Array.isArray(body.agenda) ? body.agenda.filter(Boolean) : [],
    prerequisites: body.prerequisites || "None",
    instructions: body.instructions || "",
    reminder: body.reminder || "1 hour",
    repeat: body.repeat || "None",
    ...visibilityFields(body, db.settings.batches),
    validFrom: typeof body.validFrom === "string" ? body.validFrom : "",
    validUntil: typeof body.validUntil === "string" ? body.validUntil : "",
    allowTrainerSessions,
    assignedTrainerIds,
    status,
    createdAt: new Date().toISOString(),
  };
  syncEventFromSessions(event);

  db.events.push(event);
  if (event.status === "published" && event.sessions.length) {
    db.notifications.unshift({
      id: uid("nt"),
      to: "trainees",
      title: `New training: ${event.title}`,
      body: `A new programme with ${event.sessions.length} session${event.sessions.length === 1 ? "" : "s"} starts on ${event.date}. Seats are limited to ${event.maxParticipants} — register now.`,
      kind: "event",
      at: new Date().toISOString(),
      readBy: [],
    });
  }
  // Let assigned trainers know they can add their sessions.
  for (const tid of assignedTrainerIds) {
    db.notifications.unshift({
      id: uid("nt"),
      to: tid,
      title: `You're assigned to: ${event.title}`,
      body: `${user.name} assigned you to this programme. Open it from My Events and use "Add session" to schedule your sessions.`,
      kind: "event",
      at: new Date().toISOString(),
      readBy: [],
    });
  }
  audit(db, user.name, event.status === "published" ? "event.published" : "event.drafted", event.title);
  await saveDb(db);
  return NextResponse.json({ ok: true, id: event.id });
}
