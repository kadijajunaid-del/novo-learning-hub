import type { DB, EventSession, Notification, TrainingEvent, User } from "./types";
import { todayISO } from "./format";

/** Sessions of an event, oldest first; falls back to the legacy single-date
 *  fields for events created before multi-session support. */
export function eventSessions(e: TrainingEvent): EventSession[] {
  if (Array.isArray(e.sessions) && e.sessions.length) {
    return [...e.sessions].sort((a, b) => (a.date === b.date ? (a.startTime < b.startTime ? -1 : 1) : a.date < b.date ? -1 : 1));
  }
  return [{ id: `${e.id}-s1`, name: "Session 1", trainerId: e.trainerId, category: e.category, date: e.date, startTime: e.startTime, endTime: e.endTime, platform: e.platform, venue: e.venue, meetingLink: e.meetingLink }];
}

/** Mirrors the first session into the event's legacy fields (used by cards,
 *  reports and sorting) and keeps sessions ordered. Call after any write. */
export function syncEventFromSessions(e: TrainingEvent): void {
  if (!Array.isArray(e.sessions) || !e.sessions.length) return;
  e.sessions.sort((a, b) => (a.date === b.date ? (a.startTime < b.startTime ? -1 : 1) : a.date < b.date ? -1 : 1));
  const first = e.sessions[0];
  e.date = first.date;
  e.startTime = first.startTime;
  e.endTime = first.endTime;
  e.platform = first.platform;
  e.venue = first.venue;
  e.meetingLink = first.meetingLink;
  // The event's headline trainer and category mirror the first session.
  if (first.trainerId) e.trainerId = first.trainerId;
  if (first.category) e.category = first.category;
}

export function notificationsFor(db: DB, user: User): Notification[] {
  const group = user.role === "trainer" ? "trainers" : user.role === "trainee" ? "trainees" : "";
  return db.notifications.filter((n) => n.to === "all" || n.to === user.id || (group && n.to === group));
}

export function unreadCount(db: DB, user: User): number {
  return notificationsFor(db, user).filter((n) => !n.readBy.includes(user.id)).length;
}

export function regsFor(db: DB, eventId: string) {
  return db.registrations.filter((r) => r.eventId === eventId);
}

export function eventRating(db: DB, eventId: string): number | null {
  const fb = db.feedback.filter((f) => f.eventId === eventId);
  if (!fb.length) return null;
  return fb.reduce((s, f) => s + f.rating, 0) / fb.length;
}

export function trainerRating(db: DB, trainerId: string): number | null {
  const evIds = db.events.filter((e) => e.trainerId === trainerId).map((e) => e.id);
  const fb = db.feedback.filter((f) => evIds.includes(f.eventId));
  if (!fb.length) return null;
  return fb.reduce((s, f) => s + f.rating, 0) / fb.length;
}

export function attendancePct(db: DB, eventIds?: string[]): number | null {
  let regs = db.registrations.filter((r) => r.attended !== null);
  if (eventIds) regs = regs.filter((r) => eventIds.includes(r.eventId));
  if (!regs.length) return null;
  return Math.round((regs.filter((r) => r.attended).length / regs.length) * 100);
}

/** Batches a team leader is responsible for (from settings.batchLeaders). */
export function teamLeaderBatches(db: DB, leaderId: string): string[] {
  const map = db.settings.batchLeaders ?? {};
  return Object.keys(map).filter((b) => map[b] === leaderId);
}

/** Trainees belonging to a team leader's batches. */
export function teamLeaderTrainees(db: DB, leaderId: string): User[] {
  const batches = new Set(teamLeaderBatches(db, leaderId));
  return db.users.filter((u) => u.role === "trainee" && u.batch && batches.has(u.batch));
}

/** A trainer sees events they own, deliver a session of, or are assigned to. */
export function trainerCanSee(e: TrainingEvent, trainerId: string): boolean {
  return (
    e.trainerId === trainerId ||
    (e.sessions ?? []).some((s) => s.trainerId === trainerId) ||
    (e.assignedTrainerIds ?? []).includes(trainerId)
  );
}

/** Batch visibility: an event with visibleBatches is shown only to trainees in
 *  those batches; an empty list means everyone. Trainers/admins see all. */
export function visibleToTrainee(e: TrainingEvent, user: User): boolean {
  const batches = e.visibleBatches ?? [];
  const trainees = e.visibleTrainees ?? [];
  if (batches.length || trainees.length) {
    return batches.includes(user.batch ?? "") || trainees.includes(user.id);
  }
  // Backward compatibility with the old single-string visibility field.
  const v = e.visibility || "Everyone";
  if (v.startsWith("Batch: ")) return (user.batch ?? "") === v.slice(7);
  if (v.startsWith("Department: ")) return user.department === v.slice(12);
  return true;
}

export function isUpcoming(e: TrainingEvent): boolean {
  // Upcoming as long as any session is still ahead (or today).
  return e.status === "published" && eventSessions(e).some((s) => s.date >= todayISO());
}

export function isToday(e: TrainingEvent): boolean {
  return e.status === "published" && eventSessions(e).some((s) => s.date === todayISO());
}

/** Last n months as {label, key} pairs, oldest first. */
export function lastMonths(n: number): { label: string; key: string }[] {
  const out: { label: string; key: string }[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push({
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export function trainingsPerMonth(db: DB, months = 6) {
  return lastMonths(months).map((m) => ({
    label: m.label,
    value: db.events.filter((e) => e.status !== "draft" && e.status !== "cancelled" && e.date.startsWith(m.key)).length,
  }));
}

export function attendanceTrend(db: DB, months = 6) {
  return lastMonths(months).map((m) => {
    const evIds = db.events.filter((e) => e.date.startsWith(m.key)).map((e) => e.id);
    return { label: m.label, value: attendancePct(db, evIds) ?? 0 };
  });
}

export function categoryCounts(db: DB) {
  const counts = new Map<string, number>();
  for (const e of db.events) {
    if (e.status === "draft") continue;
    counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

export function mostActiveTrainers(db: DB) {
  return db.users
    .filter((u) => u.role === "trainer")
    .map((t) => ({
      label: t.name,
      value: db.events.filter((e) => e.trainerId === t.id && e.status !== "draft" && e.status !== "cancelled").length,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}
