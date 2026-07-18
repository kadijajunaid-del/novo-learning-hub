import type { DB, TrainingEvent } from "./types";
import { uid } from "./format";
import { visibleToTrainee } from "./queries";

/** Sends the "new training" notification to the right audience: the whole
 *  trainees group for an everyone-event, or just the visible trainees for a
 *  batch/individual-restricted event. */
export function notifyNewTraining(db: DB, event: TrainingEvent): void {
  const restricted = (event.visibleBatches?.length ?? 0) > 0 || (event.visibleTrainees?.length ?? 0) > 0;
  const body = `A new programme with ${event.sessions.length} session${event.sessions.length === 1 ? "" : "s"} starts on ${event.date}. Seats are limited to ${event.maxParticipants} — register now.`;
  const at = new Date().toISOString();
  const push = (to: string) =>
    db.notifications.unshift({ id: uid("nt"), to, title: `New training: ${event.title}`, body, kind: "event", at, readBy: [] });

  if (!restricted) {
    push("trainees");
    return;
  }
  for (const u of db.users) {
    if (u.role === "trainee" && visibleToTrainee(event, u)) push(u.id);
  }
}

/** Normalises event visibility from the form into batch + trainee lists and a
 *  display label. Empty batches and trainees = visible to everyone. */
export function visibilityFields(
  body: any,
  validBatches: string[],
  validTraineeIds: string[],
): { visibility: string; visibleBatches: string[]; visibleTrainees: string[] } {
  const batches = Array.isArray(body.visibleBatches)
    ? body.visibleBatches.filter((b: string) => validBatches.includes(b))
    : [];
  const trainees = Array.isArray(body.visibleTrainees)
    ? body.visibleTrainees.filter((id: string) => validTraineeIds.includes(id))
    : [];
  let label = "Everyone";
  if (batches.length && trainees.length) label = `Batches + ${trainees.length} trainee${trainees.length === 1 ? "" : "s"}`;
  else if (batches.length) label = `Batches: ${batches.join(", ")}`;
  else if (trainees.length) label = `${trainees.length} selected trainee${trainees.length === 1 ? "" : "s"}`;
  return { visibility: label, visibleBatches: batches, visibleTrainees: trainees };
}
