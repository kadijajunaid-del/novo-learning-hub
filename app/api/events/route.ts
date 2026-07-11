import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateMeetingLink } from "@/lib/meetings";
import { uid } from "@/lib/format";
import type { TrainingEvent } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const body = await req.json();
  const db = await getDb();

  const event: TrainingEvent = {
    id: uid("ev"),
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? ""),
    trainerId: user.role === "trainer" ? user.id : (body.trainerId || user.id),
    category: body.category || "Onboarding",
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    timeZone: body.timeZone || "Europe/Copenhagen",
    platform: body.platform || "Microsoft Teams",
    venue: body.platform === "Physical Meeting" ? (body.venue || "TBC") : "Online",
    maxParticipants: Number(body.maxParticipants) || 25,
    materials: Array.isArray(body.materials) ? body.materials : [],
    agenda: Array.isArray(body.agenda) ? body.agenda.filter(Boolean) : [],
    prerequisites: body.prerequisites || "None",
    instructions: body.instructions || "",
    reminder: body.reminder || "1 hour",
    repeat: body.repeat || "None",
    visibility: body.visibility || "Everyone",
    status: body.status === "published" ? "published" : "draft",
    meetingLink: "",
    createdAt: new Date().toISOString(),
  };
  if (!event.title || !event.date || !event.startTime || !event.endTime) {
    return NextResponse.json({ error: "Title, date, start and end time are required." }, { status: 400 });
  }

  // Provision the meeting room at publish time for online platforms.
  if (event.status === "published" && event.platform !== "Physical Meeting") {
    event.meetingLink = generateMeetingLink(event.platform, event.title);
  }

  db.events.push(event);
  if (event.status === "published") {
    db.notifications.unshift({
      id: uid("nt"),
      to: "trainees",
      title: `New training: ${event.title}`,
      body: `${user.name} published a new session on ${event.date}. Seats are limited to ${event.maxParticipants} — register now.`,
      kind: "event",
      at: new Date().toISOString(),
      readBy: [],
    });
  }
  audit(db, user.name, event.status === "published" ? "event.published" : "event.drafted", event.title);
  await saveDb(db);
  return NextResponse.json({ ok: true, id: event.id });
}
