import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { eventSessions } from "@/lib/queries";
import MonthCalendar, { type CalEvent } from "@/components/month-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();

  let events = db.events;
  if (user.role === "trainee") events = events.filter((e) => e.status !== "draft");
  if (user.role === "trainer") events = events.filter((e) => e.trainerId === user.id);

  // One calendar entry per session, labelled "Sn/N" for multi-session programmes.
  const payload: CalEvent[] = events.flatMap((e) => {
    const sessions = eventSessions(e);
    return sessions.map((s, i) => ({
      id: e.id,
      title: sessions.length > 1 ? `${e.title} (S${i + 1}/${sessions.length})` : e.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: e.status,
      platform: s.platform,
      venue: s.venue,
      trainer: db.users.find((u) => u.id === e.trainerId)?.name ?? "",
      description: e.description,
    }));
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
