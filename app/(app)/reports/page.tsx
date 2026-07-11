import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Sheet } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, Badge, SectionHeader } from "@/components/ui";
import { BarChart, LineChart } from "@/components/charts";
import PrintButton from "@/components/print-button";
import { regsFor, eventRating, trainerRating, attendancePct, lastMonths, isUpcoming } from "@/lib/queries";
import { fmtDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "training", label: "Training report" },
  { key: "attendance", label: "Attendance" },
  { key: "trainers", label: "Trainer performance" },
  { key: "participation", label: "Employee participation" },
  { key: "feedback", label: "Feedback & ratings" },
  { key: "upcoming", label: "Upcoming" },
  { key: "missed", label: "Missed trainings" },
];

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; trainer?: string; category?: string; department?: string; from?: string; to?: string }>;
}) {
  const { type = "training", trainer = "", category = "", department = "", from = "", to = "" } = await searchParams;
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();
  const exportType = ["training", "attendance", "trainers", "participation", "feedback"].includes(type) ? type : "training";
  const hasFilters = Boolean(trainer || category || department || from || to);

  // ---- shared filter predicates ----
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);
  const eventMatchBase = (e: (typeof db.events)[0]) => (!category || e.category === category) && inRange(e.date);
  const eventMatch = (e: (typeof db.events)[0]) => eventMatchBase(e) && (!trainer || e.trainerId === trainer);
  const userMatch = (id: string) => {
    if (!department) return true;
    return db.users.find((u) => u.id === id)?.department === department;
  };

  const events = db.events.filter(eventMatch);
  const eventIds = new Set(events.map((e) => e.id));
  const regs = db.registrations.filter((r) => eventIds.has(r.eventId) && userMatch(r.userId));

  const trainersList = db.users.filter((u) => u.role === "trainer");
  const preserved = { ...(trainer && { trainer }), ...(category && { category }), ...(department && { department }), ...(from && { from }), ...(to && { to }) };
  const tabHref = (key: string) => `/reports?${new URLSearchParams({ type: key, ...preserved }).toString()}`;

  // Charts reflect the active filters.
  const monthly = lastMonths(6).map((m) => ({
    label: m.label,
    value: events.filter((e) => e.status !== "draft" && e.status !== "cancelled" && e.date.startsWith(m.key)).length,
  }));
  const trend = lastMonths(6).map((m) => {
    const ids = events.filter((e) => e.date.startsWith(m.key)).map((e) => e.id);
    return { label: m.label, value: attendancePct(db, ids) ?? 0 };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">Reports & analytics</h1>
          <p className="mt-1 text-sm text-ink3">
            Generated {new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
            {hasFilters && " · filters applied"}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <a href={`/api/reports/export?type=${exportType}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong">
            <Sheet size={15} /> Export Excel
          </a>
          <a href={`/api/reports/export?type=${exportType}`} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2">
            <Download size={15} /> CSV
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === t.key ? "bg-navy text-white dark:bg-primary" : "border border-line text-ink2 hover:bg-surface2"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* filter bar */}
      <form method="GET" className="no-print card mb-6 flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="type" value={type} />
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Trainer</label>
          <select name="trainer" defaultValue={trainer} className={inputCls}>
            <option value="">All trainers</option>
            {trainersList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Category</label>
          <select name="category" defaultValue={category} className={inputCls}>
            <option value="">All categories</option>
            {db.settings.categories.map((c) => <option key={c}>{c}</option>)}
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
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">From</label>
          <input type="date" name="from" defaultValue={from} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">To</label>
          <input type="date" name="to" defaultValue={to} className={inputCls} />
        </div>
        <button className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-primary">Apply filters</button>
        {hasFilters && (
          <Link href={`/reports?type=${type}`} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink2 transition hover:bg-surface2">Reset</Link>
        )}
      </form>

      {type === "training" && (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <SectionHeader title="Trainings per month" />
              <BarChart data={monthly} />
            </Card>
            <Card className="p-5">
              <SectionHeader title="Attendance trend" />
              <LineChart data={trend} />
            </Card>
          </div>
          <ReportTable
            head={["Training", "Category", "Trainer", "Date", "Platform", "Status", "Seats", "Rating"]}
            rows={events.map((e) => {
              const t = db.users.find((u) => u.id === e.trainerId);
              return [
                e.title, e.category, t?.name ?? "—", fmtDateShort(e.date), e.platform,
                <Badge key="s" tone={e.status === "completed" ? "green" : e.status === "cancelled" ? "red" : e.status === "draft" ? "gray" : "blue"}>{e.status}</Badge>,
                `${regsFor(db, e.id).length}/${e.maxParticipants}`,
                eventRating(db, e.id)?.toFixed(1) ?? "—",
              ];
            })}
          />
        </>
      )}

      {type === "attendance" && (
        <ReportTable
          head={["Training", "Date", "Employee", "Department", "Attended"]}
          rows={regs.map((r) => {
            const e = db.events.find((ev) => ev.id === r.eventId);
            const u = db.users.find((us) => us.id === r.userId);
            return [
              e?.title ?? "—", e ? fmtDateShort(e.date) : "—", u?.name ?? "—", u?.department ?? "—",
              r.attended === null ? <Badge key="a" tone="gray">Pending</Badge> : r.attended ? <Badge key="a" tone="green">Yes</Badge> : <Badge key="a" tone="red">No</Badge>,
            ];
          })}
        />
      )}

      {type === "trainers" && (
        <ReportTable
          head={["Trainer", "Department", "Status", "Delivered", "Registrations", "Attendance %", "Avg rating"]}
          rows={trainersList
            .filter((t) => !trainer || t.id === trainer)
            .map((t) => {
              const evs = db.events.filter((e) => e.trainerId === t.id && e.status !== "draft" && eventMatchBase(e));
              const evIds = evs.map((e) => e.id);
              return [
                t.name, t.department,
                t.active ? <Badge key="s" tone="green">Active</Badge> : <Badge key="s" tone="red">Disabled</Badge>,
                evs.filter((e) => e.status === "completed").length,
                db.registrations.filter((r) => evIds.includes(r.eventId)).length,
                attendancePct(db, evIds) !== null ? `${attendancePct(db, evIds)}%` : "—",
                trainerRating(db, t.id)?.toFixed(1) ?? "—",
              ];
            })}
        />
      )}

      {type === "participation" && (
        <ReportTable
          head={["Employee", "Department", "Registered", "Attended", "Missed"]}
          rows={db.users
            .filter((u) => u.role === "trainee" && (!department || u.department === department))
            .map((u) => {
              const rs = db.registrations.filter((r) => r.userId === u.id && eventIds.has(r.eventId));
              return [
                u.name, u.department, rs.length,
                rs.filter((r) => r.attended === true).length,
                rs.filter((r) => r.attended === false).length,
              ];
            })}
        />
      )}

      {type === "feedback" && (
        <ReportTable
          head={["Training", "Employee", "Rating", "Comment", "Date"]}
          rows={db.feedback
            .filter((f) => eventIds.has(f.eventId) && userMatch(f.userId))
            .map((f) => {
              const e = db.events.find((x) => x.id === f.eventId);
              const u = db.users.find((x) => x.id === f.userId);
              return [
                e?.title ?? "—",
                u?.name ?? "—",
                <span key="r" className="font-semibold text-ink">{"★".repeat(f.rating)}<span className="text-ink3">{"★".repeat(5 - f.rating)}</span> {f.rating}/5</span>,
                f.comment || "—",
                fmtDateShort(f.at.slice(0, 10)),
              ];
            })}
        />
      )}

      {type === "upcoming" && (
        <ReportTable
          head={["Training", "Date", "Trainer", "Platform", "Registered", "Capacity"]}
          rows={events.filter(isUpcoming).map((e) => [
            e.title, fmtDateShort(e.date),
            db.users.find((u) => u.id === e.trainerId)?.name ?? "—",
            e.platform, regsFor(db, e.id).length, e.maxParticipants,
          ])}
        />
      )}

      {type === "missed" && (
        <ReportTable
          head={["Employee", "Department", "Training", "Date"]}
          rows={regs
            .filter((r) => r.attended === false)
            .map((r) => {
              const u = db.users.find((x) => x.id === r.userId);
              const e = db.events.find((x) => x.id === r.eventId);
              return [u?.name ?? "—", u?.department ?? "—", e?.title ?? "—", e ? fmtDateShort(e.date) : "—"];
            })}
        />
      )}
    </div>
  );
}

function ReportTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
            {head.map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {r.map((c, j) => <td key={j} className={`px-5 py-3 ${j === 0 ? "font-medium text-ink" : "text-ink2"}`}>{c}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={head.length} className="px-5 py-8 text-center text-xs text-ink3">No data matches the current filters.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}
