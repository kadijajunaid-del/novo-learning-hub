import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { eventSessions, visibleToTrainee, trainerCanSee } from "@/lib/queries";
import MonthCalendar, { type CalEvent } from "@/components/month-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();

  let events = db.events;
  if (user.role === "trainee") events = events.filter((e) => e.status !== "draft" && visibleToTrainee(e, user));
  if (user.role === "trainer") {
    events = events.filter((e) => trainerCanSee(e, user.id));
  }

  // One calendar entry per session, labelled "Sn/N" for multi-session programmes.
  const payload: CalEvent[] = events.flatMap((e) => {
    let sessions = eventSessions(e);
    // Owners and assigned trainers see all sessions; a lone session-trainer
    // (only delivering one session) sees just their own.
    const seesAll = e.trainerId === user.id || (e.assignedTrainerIds ?? []).includes(user.id);
    if (user.role === "trainer" && !seesAll) {
      sessions = sessions.filter((s) => s.trainerId === user.id);
    }
    const total = eventSessions(e).length;
    return sessions.map((s) => {
      const idx = eventSessions(e).findIndex((x) => x.id === s.id);
      return {
        id: e.id,
        title: total > 1 ? `${e.title} (S${idx + 1}/${total})` : e.title,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: e.status,
        platform: s.platform,
        venue: s.venue,
        trainer: db.users.find((u) => u.id === (s.trainerId || e.trainerId))?.name ?? "",
        description: `${s.name ? `${s.name} — ` : ""}${e.description}`,
      };
    });
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Training calendar</h1>
        <p className="mt-1 text-sm text-ink3">
          {user.role === "trainer" ? "Your sessions at a glance." : "All sessions at a glance."} Click any event for details and one-click registration.
        </p>
      </div>
      <MonthCalendar events={payload} />
    </div>
  );
}
