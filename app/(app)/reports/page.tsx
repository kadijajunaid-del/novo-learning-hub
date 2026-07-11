import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Sheet } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, Badge, SectionHeader } from "@/components/ui";
import { BarChart, LineChart } from "@/components/charts";
import PrintButton from "@/components/print-button";
import { regsFor, eventRating, trainerRating, attendancePct, trainingsPerMonth, attendanceTrend, isUpcoming } from "@/lib/queries";
import { fmtDateShort, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "training", label: "Training report" },
  { key: "attendance", label: "Attendance" },
  { key: "trainers", label: "Trainer performance" },
  { key: "participation", label: "Employee participation" },
  { key: "certificates", label: "Certificates" },
  { key: "feedback", label: "Feedback & ratings" },
  { key: "upcoming", label: "Upcoming" },
  { key: "missed", label: "Missed trainings" },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "training" } = await searchParams;
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();
  const exportType = ["training", "attendance", "trainers", "participation", "certificates", "feedback"].includes(type) ? type : "training";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">Reports & analytics</h1>
          <p className="mt-1 text-sm text-ink3">Generated {new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}</p>
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

      <div className="no-print mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/reports?type=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === t.key ? "bg-navy text-white dark:bg-primary" : "border border-line text-ink2 hover:bg-surface2"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {type === "training" && (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <SectionHeader title="Trainings per month" />
              <BarChart data={trainingsPerMonth(db)} />
            </Card>
            <Card className="p-5">
              <SectionHeader title="Attendance trend" />
              <LineChart data={attendanceTrend(db)} />
            </Card>
          </div>
          <ReportTable
            head={["Training", "Category", "Trainer", "Date", "Platform", "Status", "Seats", "Rating"]}
            rows={db.events.map((e) => {
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
          rows={db.registrations.map((r) => {
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
          rows={db.users.filter((u) => u.role === "trainer").map((t) => {
            const evs = db.events.filter((e) => e.trainerId === t.id && e.status !== "draft");
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
          head={["Employee", "Department", "Registered", "Attended", "Missed", "Certificates"]}
          rows={db.users.filter((u) => u.role === "trainee").map((u) => {
            const regs = db.registrations.filter((r) => r.userId === u.id);
            return [
              u.name, u.department, regs.length,
              regs.filter((r) => r.attended === true).length,
              regs.filter((r) => r.attended === false).length,
              db.certificates.filter((c) => c.userId === u.id).length,
            ];
          })}
        />
      )}

      {type === "certificates" && (
        <ReportTable
          head={["Certificate", "Employee", "Training", "Issued"]}
          rows={db.certificates.map((c) => [
            c.code,
            db.users.find((u) => u.id === c.userId)?.name ?? "—",
            db.events.find((e) => e.id === c.eventId)?.title ?? "—",
            c.issuedAt.slice(0, 10),
          ])}
        />
      )}

      {type === "feedback" && (
        <ReportTable
          head={["Training", "Employee", "Rating", "Comment", "Date"]}
          rows={db.feedback.map((f) => {
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
          rows={db.events.filter(isUpcoming).map((e) => [
            e.title, fmtDateShort(e.date),
            db.users.find((u) => u.id === e.trainerId)?.name ?? "—",
            e.platform, regsFor(db, e.id).length, e.maxParticipants,
          ])}
        />
      )}

      {type === "missed" && (
        <ReportTable
          head={["Employee", "Department", "Training", "Date"]}
          rows={db.registrations.filter((r) => r.attended === false).map((r) => {
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
          {!rows.length && <tr><td colSpan={head.length} className="px-5 py-8 text-center text-xs text-ink3">No data for this report yet.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}
