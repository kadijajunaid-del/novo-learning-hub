import type { TrainingEvent, User } from "./types";

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
 * Builds an Outlook-compatible calendar invitation (.ics) with the meeting
 * link, agenda, trainer, location, description and an automatic reminder.
 */
export function buildIcs(event: TrainingEvent, trainer: User | undefined, attendee: User): string {
  const minutes = REMINDER_MINUTES[event.reminder] ?? 60;
  const descriptionParts = [
    event.description,
    "",
    trainer ? `Trainer: ${trainer.name} (${trainer.email})` : "",
    event.meetingLink ? `Join: ${event.meetingLink}` : "",
    event.agenda.length ? `Agenda:\n${event.agenda.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : "",
    event.prerequisites && event.prerequisites !== "None" ? `Prerequisites: ${event.prerequisites}` : "",
    event.materials.length ? `Materials: ${event.materials.map((m) => m.name).join(", ")}` : "",
    event.instructions ? `Instructions: ${event.instructions}` : "",
  ].filter(Boolean);

  const location = event.platform === "Physical Meeting" ? event.venue : `${event.platform} — ${event.meetingLink}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Novo Nordisk//Learning Hub//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.id}-${attendee.id}@learninghub.novonordisk.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`,
    `DTSTART;TZID=${event.timeZone}:${dt(event.date, event.startTime)}`,
    `DTEND;TZID=${event.timeZone}:${dt(event.date, event.endTime)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(descriptionParts.join("\n"))}`,
    `LOCATION:${icsEscape(location)}`,
    event.meetingLink ? `URL:${event.meetingLink}` : "",
    trainer ? `ORGANIZER;CN=${icsEscape(trainer.name)}:mailto:${trainer.email}` : "",
    `ATTENDEE;CN=${icsEscape(attendee.name)};RSVP=TRUE:mailto:${attendee.email}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${icsEscape(event.title)}`,
    `TRIGGER:-PT${minutes}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
