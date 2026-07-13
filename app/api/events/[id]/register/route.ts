import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateMeetingLink } from "@/lib/meetings";
import { uid } from "@/lib/format";

/**
 * The "Notify Me" flow: registers the trainee, provisions the meeting room
 * on the selected platform, sends the confirmation notification, and points
 * the client at the Outlook calendar invitation (.ics) download.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event || event.status !== "published") {
    return NextResponse.json({ error: "This event is not open for registration." }, { status: 400 });
  }
  // Validity window
  const today = new Date().toISOString().slice(0, 10);
  if (event.validFrom && today < event.validFrom) {
    return NextResponse.json({ error: `Registration opens on ${event.validFrom}.` }, { status: 400 });
  }
  if (event.validUntil && today > event.validUntil) {
    return NextResponse.json({ error: "Registration for this event has closed." }, { status: 400 });
  }
  if (db.registrations.some((r) => r.eventId === id && r.userId === user.id)) {
    return NextResponse.json({ error: "You are already registered for this training." }, { status: 409 });
  }
  const count = db.registrations.filter((r) => r.eventId === id).length;
  if (count >= event.maxParticipants) {
    return NextResponse.json({ error: "This session is fully booked." }, { status: 409 });
  }

  if (event.platform !== "Physical Meeting" && !event.meetingLink) {
    event.meetingLink = generateMeetingLink(event.platform, event.title);
  }

  db.registrations.push({ id: uid("rg"), eventId: id, userId: user.id, at: new Date().toISOString(), attended: null });

  const trainer = db.users.find((u) => u.id === event.trainerId);
  db.notifications.unshift({
    id: uid("nt"),
    to: user.id,
    title: `Registered: ${event.title}`,
    body: `You are confirmed for ${event.date}, ${event.startTime}–${event.endTime} with ${trainer?.name ?? "your trainer"}. A confirmation email and Outlook calendar invitation (with the ${event.platform} link, agenda and a ${event.reminder} reminder) have been sent to ${user.email}.`,
    kind: "registration",
    at: new Date().toISOString(),
    readBy: [],
  });
  db.notifications.unshift({
    id: uid("nt"),
    to: event.trainerId,
    title: `New registration: ${event.title}`,
    body: `${user.name} (${user.department}) registered. ${count + 1}/${event.maxParticipants} seats taken.`,
    kind: "registration",
    at: new Date().toISOString(),
    readBy: [],
  });
  audit(db, user.name, "registration.created", event.title);
  await saveDb(db);

  return NextResponse.json({
    ok: true,
    meetingLink: event.meetingLink,
    icsUrl: `/api/events/${id}/ics`,
    message: "You have successfully registered for this training.",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const idx = db.registrations.findIndex((r) => r.eventId === id && r.userId === user.id);
  if (idx === -1) return NextResponse.json({ error: "You are not registered for this event." }, { status: 404 });
  db.registrations.splice(idx, 1);
  const event = db.events.find((e) => e.id === id);
  audit(db, user.name, "registration.cancelled", event?.title ?? id);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
