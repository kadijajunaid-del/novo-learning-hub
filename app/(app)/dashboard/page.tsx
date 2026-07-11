import Link from "next/link";
import {
  CalendarDays, CalendarCheck2, Users, GraduationCap, CheckCircle2, Hourglass,
  ClipboardList, Star, Percent, Bell, Activity, TrendingUp, Sparkles, Plus,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, StatCard, SectionHeader, Badge, Avatar, EmptyState, statusTone } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { BarChart, LineChart, DonutChart, HBarChart } from "@/components/charts";
import {
  notificationsFor, regsFor, trainerRating, attendancePct, isUpcoming, isToday,
  trainingsPerMonth, attendanceTrend, categoryCounts, mostActiveTrainers,
} from "@/lib/queries";
import { fmtDate, fmtDateShort, fmtTime, relTime, todayISO } from "@/lib/format";
import type { DB, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink3">
          {user.role === "admin" && "Here is what's happening across the Learning Hub today."}
          {user.role === "trainer" && "Here is your training schedule and trainee activity."}
          {user.role === "trainee" && "Continue your onboarding journey — here's what's next."}
        </p>
      </div>
      {user.role === "admin" && <AdminDashboard db={db} user={user} />}
      {user.role === "trainer" && <TrainerDashboard db={db} user={user} />}
      {user.role === "trainee" && <TraineeDashboard db={db} user={user} />}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function NotificationsCard({ db, user }: { db: DB; user: User }) {
  const items = notificationsFor(db, user).slice(0, 5);
  return (
    <Card className="p-5">
      <SectionHeader title="Latest notifications" action={<Link href="/notifications" className="text-xs font-semibold text-primary hover:underline">View all</Link>} />
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Bell size={14} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-ink">{n.title}</div>
              <div className="line-clamp-2 text-xs leading-relaxed text-ink3">{n.body}</div>
              <div className="mt-0.5 text-[11px] text-ink3">{relTime(n.at)}</div>
            </div>
          </li>
        ))}
        {!items.length && <EmptyState icon={<Bell size={22} />} title="No notifications yet" />}
      </ul>
    </Card>
  );
}

/* ============================== ADMIN ============================== */

function AdminDashboard({ db, user }: { db: DB; user: User }) {
  const upcoming = db.events.filter(isUpcoming);
  const today = db.events.filter(isToday);
  const trainers = db.users.filter((u) => u.role === "trainer" && u.active);
  const trainees = db.users.filter((u) => u.role === "trainee" && u.active);
  const completed = db.events.filter((e) => e.status === "completed");
  const pending = upcoming.filter((e) => !isToday(e));
  const avgRating = db.feedback.length
    ? (db.feedback.reduce((s, f) => s + f.rating, 0) / db.feedback.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard href="/events?when=upcoming" label="Upcoming events" value={upcoming.length} icon={<CalendarDays size={19} />} accent="var(--s1)" sub="Published & scheduled" />
        <StatCard href="/events?when=today" label="Today's sessions" value={today.length} icon={<CalendarCheck2 size={19} />} accent="#001965" sub={fmtDate(todayISO())} />
        <StatCard href="/trainers" label="Active trainers" value={trainers.length} icon={<Users size={19} />} accent="var(--s4)" sub={`of ${db.settings.maxTrainers} configured`} />
        <StatCard href="/trainees" label="Active trainees" value={trainees.length} icon={<GraduationCap size={19} />} accent="var(--s2)" sub="New hires onboarding" />
        <StatCard href="/events?status=completed" label="Completed trainings" value={completed.length} icon={<CheckCircle2 size={19} />} accent="var(--s2)" />
        <StatCard href="/events?when=ahead" label="Pending trainings" value={pending.length} icon={<Hourglass size={19} />} accent="var(--s3)" sub="Scheduled ahead" />
        <StatCard href="/reports?type=attendance" label="Total registrations" value={db.registrations.length} icon={<ClipboardList size={19} />} accent="var(--s1)" />
        <StatCard href="/reports?type=feedback" label="Average rating" value={avgRating} icon={<Star size={19} />} accent="var(--s3)" sub={`${db.feedback.length} reviews`} />
        <StatCard href="/reports?type=attendance" label="Attendance" value={`${attendancePct(db) ?? 0}%`} icon={<Percent size={19} />} accent="var(--s2)" sub="Across completed sessions" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeader title="Trainings per month" sub="Delivered and scheduled sessions" />
          <BarChart data={trainingsPerMonth(db)} />
        </Card>
        <Card className="p-5">
          <SectionHeader title="Attendance trend" sub="Monthly attendance rate — completed sessions" />
          <LineChart data={attendanceTrend(db)} />
        </Card>
        <Card className="p-5">
          <SectionHeader title="Training categories" sub="Share of sessions by category" />
          <DonutChart data={categoryCounts(db)} centerLabel="sessions" />
        </Card>
        <Card className="p-5">
          <SectionHeader title="Most active trainers" sub="Sessions delivered or scheduled" />
          <HBarChart data={mostActiveTrainers(db)} valueSuffix=" sessions" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <SectionHeader title="Upcoming events" action={<Link href="/events" className="text-xs font-semibold text-primary hover:underline">All events</Link>} />
          <ul className="space-y-3">
            {upcoming.slice(0, 5).map((e) => {
              const t = db.users.find((u) => u.id === e.trainerId);
              return (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface2">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary-strong dark:text-primary">
                      <span className="text-sm font-extrabold leading-4">{e.date.slice(8)}</span>
                      <span className="text-[9px] font-bold uppercase">{fmtDateShort(e.date).split(" ")[1]}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{e.title}</span>
                      <span className="block text-xs text-ink3">{fmtTime(e.startTime)} · {t?.name}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
        <NotificationsCard db={db} user={user} />
        <Card className="p-5">
          <SectionHeader title="Recent activity" sub="Audit log" />
          <ul className="space-y-3">
            {db.audit.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-ink2">
                  <Activity size={14} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] text-ink">
                    <span className="font-semibold">{a.actor}</span>{" "}
                    <span className="text-ink2">{a.action.replace(/\./g, " → ")}</span>
                  </div>
                  <div className="truncate text-xs text-ink3">{a.detail} · {relTime(a.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ============================== TRAINER ============================== */

function TrainerDashboard({ db, user }: { db: DB; user: User }) {
  const mine = db.events.filter((e) => e.trainerId === user.id);
  const myUpcoming = mine.filter(isUpcoming);
  const myToday = mine.filter(isToday);
  const myCompleted = mine.filter((e) => e.status === "completed");
  const myPending = mine.filter((e) => e.status === "draft" || (isUpcoming(e) && !isToday(e)));
  const myEventIds = mine.map((e) => e.id);
  const myTraineeIds = new Set(db.registrations.filter((r) => myEventIds.includes(r.eventId)).map((r) => r.userId));
  const rating = trainerRating(db, user.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard href="/events?when=today" label="Today's sessions" value={myToday.length} icon={<CalendarCheck2 size={19} />} accent="#001965" />
        <StatCard href="/events?when=upcoming" label="Upcoming sessions" value={myUpcoming.length} icon={<CalendarDays size={19} />} accent="var(--s1)" />
        <StatCard href="/trainees" label="My trainees" value={myTraineeIds.size} icon={<GraduationCap size={19} />} accent="var(--s2)" sub="Unique registrants" />
        <StatCard href="/events?status=completed" label="Completed" value={myCompleted.length} icon={<CheckCircle2 size={19} />} accent="var(--s2)" />
        <StatCard href="/events" label="Pending" value={myPending.length} icon={<Hourglass size={19} />} accent="var(--s3)" sub="Drafts & scheduled" />
        <StatCard href="/reports?type=attendance" label="Attendance" value={`${attendancePct(db, myEventIds) ?? 0}%`} icon={<Percent size={19} />} accent="var(--s4)" sub={rating ? `★ ${rating.toFixed(1)} avg rating` : undefined} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader title="Today & next up" sub="Your sessions, soonest first" />
        <Link href="/events/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong">
          <Plus size={16} /> Create event
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...myToday, ...myUpcoming.filter((e) => !isToday(e))].slice(0, 6).map((e) => (
          <EventCard key={e.id} event={e} trainer={user} seatsTaken={regsFor(db, e.id).length} />
        ))}
        {!myToday.length && !myUpcoming.length && (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState icon={<CalendarDays size={22} />} title="No upcoming sessions" sub="Create a new training event to get started." />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Attendance summary" sub="Attendance across your recent sessions" />
          <HBarChart
            data={myCompleted.slice(-5).map((e) => ({
              label: e.title,
              value: attendancePct(db, [e.id]) ?? 0,
            }))}
            valueSuffix="%"
            color="var(--s2)"
          />
        </Card>
        <NotificationsCard db={db} user={user} />
      </div>
    </div>
  );
}

/* ============================== TRAINEE ============================== */

function TraineeDashboard({ db, user }: { db: DB; user: User }) {
  const myRegs = db.registrations.filter((r) => r.userId === user.id);
  const myEventIds = myRegs.map((r) => r.eventId);
  const registeredUpcoming = db.events.filter((e) => myEventIds.includes(e.id) && isUpcoming(e));
  const history = db.events.filter((e) => myEventIds.includes(e.id) && (e.status === "completed" || e.date < todayISO()));
  const attended = myRegs.filter((r) => r.attended === true).length;
  const decided = myRegs.filter((r) => r.attended !== null).length;
  const progress = decided ? Math.round((attended / decided) * 100) : 0;
  const recommended = db.events
    .filter((e) => isUpcoming(e) && !myEventIds.includes(e.id))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard href="/calendar" label="Upcoming trainings" value={registeredUpcoming.length} icon={<CalendarDays size={19} />} accent="var(--s1)" sub="You are registered" />
        <StatCard href="/events" label="Total registrations" value={myRegs.length} icon={<ClipboardList size={19} />} accent="#001965" />
        <StatCard href="/events" label="Completion rate" value={`${progress}%`} icon={<TrendingUp size={19} />} accent="var(--s2)" sub={`${attended} of ${decided || "0"} attended`} />
      </div>

      <div>
        <SectionHeader
          title="Your upcoming trainings"
          sub="Sessions you registered for"
          action={<Link href="/events" className="text-xs font-semibold text-primary hover:underline">Browse catalogue</Link>}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {registeredUpcoming.map((e) => (
            <EventCard key={e.id} event={e} trainer={db.users.find((u) => u.id === e.trainerId)} registered seatsTaken={regsFor(db, e.id).length} />
          ))}
          {!registeredUpcoming.length && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={<CalendarDays size={22} />} title="Nothing booked yet" sub="Browse the catalogue and press Notify Me on any published training to register." />
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="Recommended for you" sub="Popular sessions with open seats — powered by your onboarding profile" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommended.map((e) => (
            <EventCard key={e.id} event={e} trainer={db.users.find((u) => u.id === e.trainerId)} seatsTaken={regsFor(db, e.id).length} />
          ))}
          {!recommended.length && <EmptyState icon={<Sparkles size={22} />} title="You're registered for everything!" />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Training history" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
                  <th className="pb-2 pr-4 font-semibold">Training</th>
                  <th className="pb-2 pr-4 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => {
                  const reg = myRegs.find((r) => r.eventId === e.id);
                  return (
                    <tr key={e.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link href={`/events/${e.id}`} className="font-medium text-ink hover:text-primary">{e.title}</Link>
                      </td>
                      <td className="py-2.5 pr-4 text-ink2">{fmtDateShort(e.date)}</td>
                      <td className="py-2.5">
                        {reg?.attended === true && <Badge tone="green">Attended</Badge>}
                        {reg?.attended === false && <Badge tone="red">Missed</Badge>}
                        {reg?.attended === null && <Badge tone="gray">Pending</Badge>}
                      </td>
                    </tr>
                  );
                })}
                {!history.length && (
                  <tr><td colSpan={3} className="py-6 text-center text-xs text-ink3">Your completed trainings will appear here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <NotificationsCard db={db} user={user} />
      </div>
    </div>
  );
}
