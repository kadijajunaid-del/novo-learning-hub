import type { Platform } from "./types";

const rand = (chars: string, n: number) =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

const lower = "abcdefghijklmnopqrstuvwxyz";
const alnum = "abcdefghijklmnopqrstuvwxyz0123456789";
const digits = "0123456789";

/**
 * Simulated meeting-link provisioning. In production this calls the
 * Microsoft Graph / Zoom / Google / Webex APIs configured in Admin Settings;
 * here it returns realistic links so the full flow works end to end.
 */
export function generateMeetingLink(platform: Platform, title: string): string {
  switch (platform) {
    case "Microsoft Teams":
      return `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${rand(alnum, 24)}%40thread.v2/0`;
    case "Zoom":
      return `https://novonordisk.zoom.us/j/9${rand(digits, 9)}?pwd=${rand(alnum, 20)}`;
    case "Google Meet":
      return `https://meet.google.com/${rand(lower, 3)}-${rand(lower, 4)}-${rand(lower, 3)}`;
    case "Cisco Webex":
      return `https://novonordisk.webex.com/meet/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}-${rand(digits, 4)}`;
    default:
      return "";
  }
}
