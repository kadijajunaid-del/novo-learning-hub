import type { EventSession } from "./types";
import { generateMeetingLink } from "./meetings";
import { uid } from "./format";

/** Validates and normalises the sessions array sent by the event form.
 *  Returns null if no valid session is present. Meeting links are kept when
 *  supplied, generated for online sessions at publish time, and cleared for
 *  physical meetings. */
export function normalizeSessions(raw: any, title: string, published: boolean): EventSession[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const sessions: EventSession[] = [];
  for (const s of raw) {
    if (!s || !s.date || !s.startTime || !s.endTime) return null;
    const platform = s.platform || "Microsoft Teams";
    const physical = platform === "Physical Meeting";
    let meetingLink = typeof s.meetingLink === "string" ? s.meetingLink : "";
    if (physical) meetingLink = "";
    else if (published && !meetingLink) meetingLink = generateMeetingLink(platform, title);
    sessions.push({
      id: s.id && String(s.id).startsWith("ss_") ? s.id : uid("ss"),
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      platform,
      venue: physical ? (s.venue || "TBC") : "Online",
      meetingLink,
    });
  }
  return sessions;
}
