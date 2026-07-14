import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import TraineeManager, { type TraineeRow } from "@/components/trainee-manager";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary";

export default async function TraineesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; batch?: string; from?: string; to?: string }>;
}) {
  const { q = "", department = "", batch = "", from = "", to = "" } = await searchParams;
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();
  const hasFilters = Boolean(q || department || batch || from || to);

  // Trainers see the people registered for their sessions; admin sees everyone.
  const myEventIds = user.role === "trainer" ? db.events.filter((e) => e.trainerId === user.id || (e.sessions ?? []).some((s) => s.trainerId === user.id)).map((e) => e.id) : null;
  const needle = q.trim().toLowerCase();
  const trainees = db.users.filter((u) => {
    if (u.role !== "trainee") return false;
    if (myEventIds && !db.registrations.some((r) => r.userId === u.id && myEventIds.includes(r.eventId))) return false;
    if (needle && !`${u.name} ${u.email} ${u.title}`.toLowerCase().includes(needle)) return false;
    if (department && u.department !== department) return false;
    if (batch && (u.batch ?? "") !== batch) return false;
    if (from && u.joined < from) return false;
    if (to && u.joined > to) return false;
    return true;
  });

  const rows: TraineeRow[] = trainees.map((t) => {
    const regs = db.registrations.filter((r) => r.userId === t.id && (!myEventIds || myEventIds.includes(r.eventId)));
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      department: t.department,
      title: t.title,
      batch: t.batch ?? "",
      active: t.active,
      joined: t.joined,
      registered: regs.length,
      attended: regs.filter((r) => r.attended === true).length,
      missed: regs.filter((r) => r.attended === false).length,
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">
          {user.role === "trainer" ? "My trainees" : "Trainees"}
        </h1>
        <p className="mt-1 text-sm text-ink3">
          {rows.length} new hire{rows.length === 1 ? "" : "s"} onboarding — click a person for their full training history.
        </p>
      </div>

      <form method="GET" className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-44 flex-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Employee</label>
          <input name="q" defaultValue={q} placeholder="Name, email or job title…" className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Batch</label>
          <select name="batch" defaultValue={batch} className={inputCls}>
            <option value="">All batches</option>
            {db.settings.batches.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Department</label>
          <select name="department" defaultValue={department} className={inputCls}>
            <option value="">All departments</option>
            {db.settings.departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Joined from</label>
          <input type="date" name="from" defaultValue={from} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Joined to</label>
          <input type="date" name="to" defaultValue={to} className={inputCls} />
        </div>
        <button className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-primary">Apply filters</button>
        {hasFilters && (
          <Link href="/trainees" className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink2 transition hover:bg-surface2">Reset</Link>
        )}
      </form>

      <TraineeManager
        trainees={rows}
        departments={db.settings.departments}
        batches={db.settings.batches}
        isAdmin={user.role === "admin"}
      />
    </div>
  );
}
