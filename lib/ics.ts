import type { TrainingEvent, User } from "./types";
import { eventSessions } from "./queries";

const REMINDER_MINUTES: Record<string, number> = {
  "15 mins": 15,
  "30 mins": 30,
  "1 hour": 60,
  "1 day": 1440,
};

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function dt(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

/**
 * Builds an Outlook-compatible calendar invitation (.ics) containing one
 * calendar entry per session, each with its own meeting link, location,
 * agenda, trainer and reminder alarm.
 */
export function buildIcs(event: TrainingEvent, trainer: User | undefined, attendee: User, users?: User[]): string {
  const minutes = REMINDER_MINUTES[event.reminder] ?? 60;
  const sessions = eventSessions(event);
  const total = sessions.length;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

  const vevents = sessions.flatMap((s, i) => {
    const sessionTrainer = (users ?? []).find((u) => u.id === s.trainerId) ?? trainer;
    const sessionName = s.name || `Session ${i + 1}`;
    const label = total > 1 ? `${event.title} — ${sessionName} (${i + 1}/${total})` : event.title;
    const descriptionParts = [
      event.description,
      "",
      total > 1 ? `${sessionName} — session ${i + 1} of ${total}` : "",
      sessionTrainer ? `Trainer: ${sessionTrainer.name} (${sessionTrainer.email})` : "",
      s.meetingLink ? `Join: ${s.meetingLink}` : "",
      event.agenda.length ? `Agenda:\n${event.agenda.map((a, n) => `${n + 1}. ${a}`).join("\n")}` : "",
      event.prerequisites && event.prerequisites !== "None" ? `Prerequisites: ${event.prerequisites}` : "",
      event.materials.length ? `Materials: ${event.materials.map((m) => m.name).join(", ")}` : "",
      event.instructions ? `Instructions: ${event.instructions}` : "",
    ].filter(Boolean);
    const location = s.platform === "Physical Meeting" ? s.venue : `${s.platform} — ${s.meetingLink}`;

    return [
      "BEGIN:VEVENT",
      `UID:${event.id}-${s.id}-${attendee.id}@learninghub.novonordisk.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${event.timeZone}:${dt(s.date, s.startTime)}`,
      `DTEND;TZID=${event.timeZone}:${dt(s.date, s.endTime)}`,
      `SUMMARY:${icsEscape(label)}`,
      `DESCRIPTION:${icsEscape(descriptionParts.join("\n"))}`,
      `LOCATION:${icsEscape(location)}`,
      s.meetingLink ? `URL:${s.meetingLink}` : "",
      trainer ? `ORGANIZER;CN=${icsEscape(trainer.name)}:mailto:${trainer.email}` : "",
      `ATTENDEE;CN=${icsEscape(attendee.name)};RSVP=TRUE:mailto:${attendee.email}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${icsEscape(label)}`,
      `TRIGGER:-PT${minutes}M`,
      "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean);
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Novo Nordisk//Learning Hub//EN",
    "METHOD:REQUEST",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}
