import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { normalizeSessions } from "@/lib/sessions";
import { syncEventFromSessions } from "@/lib/queries";
import { uid } from "@/lib/format";
import type { TrainingEvent } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const body = await req.json();
  const db = await getDb();

  const status = body.status === "published" ? "published" : "draft";
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const sessions = normalizeSessions(body.sessions, title, status === "published");
  if (!sessions) {
    return NextResponse.json({ error: "Add at least one session with a date, start and end time." }, { status: 400 });
  }

  // Admins can assign the event to any trainer; trainers own their events.
  let trainerId = user.id;
  if (user.role === "admin" && body.trainerId && db.users.some((u) => u.id === body.trainerId && u.role === "trainer")) {
    trainerId = body.trainerId;
  }

  const event: TrainingEvent = {
    id: uid("ev"),
    title,
    description: String(body.description ?? ""),
    trainerId,
    category: body.category || "Onboarding",
    sessions,
    date: "", startTime: "", endTime: "", platform: "Microsoft Teams", venue: "", meetingLink: "",
    timeZone: body.timeZone || "Europe/Copenhagen",
    maxParticipants: Number(body.maxParticipants) || 25,
    materials: Array.isArray(body.materials) ? body.materials : [],
    agenda: Array.isArray(body.agenda) ? body.agenda.filter(Boolean) : [],
    prerequisites: body.prerequisites || "None",
    instructions: body.instructions || "",
    reminder: body.reminder || "1 hour",
    repeat: body.repeat || "None",
    visibility: body.visibility || "Everyone",
    status,
    createdAt: new Date().toISOString(),
  };
  syncEventFromSessions(event);

  db.events.push(event);
  if (event.status === "published") {
    db.notifications.unshift({
      id: uid("nt"),
      to: "trainees",
      title: `New training: ${event.title}`,
      body: `A new programme with ${sessions.length} session${sessions.length === 1 ? "" : "s"} starts on ${event.date}. Seats are limited to ${event.maxParticipants} — register now.`,
      kind: "event",
      at: new Date().toISOString(),
      readBy: [],
    });
  }
  audit(db, user.name, event.status === "published" ? "event.published" : "event.drafted", event.title);
  await saveDb(db);
  return NextResponse.json({ ok: true, id: event.id });
}
