import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, Mail, XCircle } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, Avatar, Badge, StatCard } from "@/components/ui";
import DeleteUser from "@/components/delete-user";
import { fmtDate, fmtDateShort, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();
  const trainee = db.users.find((u) => u.id === id && u.role === "trainee");
  if (!trainee) notFound();

  const regs = db.registrations.filter((r) => r.userId === id);
  const history = regs
    .map((r) => {
      const event = db.events.find((e) => e.id === r.eventId);
      return event ? { reg: r, event } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a!.event.date < b!.event.date ? 1 : -1)) as { reg: (typeof regs)[0]; event: (typeof db.events)[0] }[];
  const feedback = db.feedback.filter((f) => f.userId === id);
  const attended = regs.filter((r) => r.attended === true).length;
  const missed = regs.filter((r) => r.attended === false).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/trainees" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink3 transition hover:text-primary">
        <ArrowLeft size={15} /> Back to trainees
      </Link>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={trainee.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">{trainee.name}</h1>
              {trainee.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-ink2">{trainee.title} · {trainee.department}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink3">
              <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {trainee.email}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Joined {fmtDate(trainee.joined)}</span>
            </p>
          </div>
          {user.role === "admin" && (
            <DeleteUser
              endpoint={`/api/trainees/${trainee.id}`}
              name={trainee.name}
              warning="This permanently removes the account together with all registrations and feedback. This cannot be undone."
              redirectTo="/trainees"
            />
          )}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Registrations" value={regs.length} icon={<ClipboardList size={19} />} accent="var(--s1)" />
        <StatCard label="Attended" value={attended} icon={<CheckCircle2 size={19} />} accent="var(--s2)" />
        <StatCard label="Missed" value={missed} icon={<XCircle size={19} />} accent="var(--crit)" />
      </div>

      <Card className="overflow-x-auto">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink3">Training history</h2>
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
              <th className="px-5 py-3.5 font-semibold">Training</th>
              <th className="px-5 py-3.5 font-semibold">Date & time</th>
              <th className="px-5 py-3.5 font-semibold">Trainer</th>
              <th className="px-5 py-3.5 font-semibold">Platform</th>
              <th className="px-5 py-3.5 font-semibold">Attendance</th>
              <th className="px-5 py-3.5 font-semibold">Rating given</th>
            </tr>
          </thead>
          <tbody>
            {history.map(({ reg, event }) => {
              const trainer = db.users.find((u) => u.id === event.trainerId);
              const fb = feedback.find((f) => f.eventId === event.id);
              return (
                <tr key={event.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <Link href={`/events/${event.id}`} className="font-semibold text-ink hover:text-primary">{event.title}</Link>
                    <div className="text-xs text-ink3">{event.category}</div>
                  </td>
                  <td className="px-5 py-3.5 text-ink2">
                    {fmtDateShort(event.date)}
                    <div className="text-xs text-ink3">{fmtTime(event.startTime)} – {fmtTime(event.endTime)}</div>
                  </td>
                  <td className="px-5 py-3.5 text-ink2">{trainer?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-ink2">{event.platform}</td>
                  <td className="px-5 py-3.5">
                    {reg.attended === true && <Badge tone="green">Attended</Badge>}
                    {reg.attended === false && <Badge tone="red">Missed</Badge>}
                    {reg.attended === null && <Badge tone="gray">Pending</Badge>}
                  </td>
                  <td className="px-5 py-3.5 text-ink2">{fb ? `★ ${fb.rating}/5` : "—"}</td>
                </tr>
              );
            })}
            {!history.length && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-ink3">No registrations yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
