import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import MonthCalendar, { type CalEvent } from "@/components/month-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();

  let events = db.events;
  if (user.role === "trainee") events = events.filter((e) => e.status !== "draft");
  if (user.role === "trainer") events = events.filter((e) => e.trainerId === user.id);

  const payload: CalEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    status: e.status,
    platform: e.platform,
    venue: e.venue,
    trainer: db.users.find((u) => u.id === e.trainerId)?.name ?? "",
    description: e.description,
  }));

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
