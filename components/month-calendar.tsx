"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Video, X, ArrowRight } from "lucide-react";
import { monthName, fmtTime, fmtDate, todayISO } from "@/lib/format";

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  platform: string;
  venue: string;
  trainer: string;
  description: string;
};

const STATUS_COLOR: Record<string, string> = {
  today: "var(--s1)",
  upcoming: "var(--serious)",
  completed: "var(--ok)",
  cancelled: "var(--crit)",
  draft: "var(--ink-3)",
};

function eventKind(e: CalEvent): keyof typeof STATUS_COLOR {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "draft") return "draft";
  if (e.status === "completed" || e.date < todayISO()) return "completed";
  if (e.date === todayISO()) return "today";
  return "upcoming";
}

const LEGEND = [
  { key: "today", label: "Scheduled today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "draft", label: "Draft" },
];

export default function MonthCalendar({ events }: { events: CalEvent[] }) {
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [year, month] = ym;

  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dayIso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDay = (d: number) => events.filter((e) => e.date === dayIso(d));

  return (
    <div>
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{monthName(year, month)}</h2>
          <div className="flex items-center gap-2">
            <button aria-label="Previous month" onClick={() => setYm(month === 0 ? [year - 1, 11] : [year, month - 1])} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink2 transition hover:bg-surface2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setYm([now.getFullYear(), now.getMonth()])} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink2 transition hover:bg-surface2">
              Today
            </button>
            <button aria-label="Next month" onClick={() => setYm(month === 11 ? [year + 1, 0] : [year, month + 1])} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink2 transition hover:bg-surface2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-surface2 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-ink3">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const isToday = d !== null && dayIso(d) === todayISO();
            return (
              <div key={i} className={`min-h-24 bg-surface p-1.5 ${d === null ? "opacity-40" : ""}`}>
                {d !== null && (
                  <>
                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-primary text-white" : "text-ink2"}`}>
                      {d}
                    </div>
                    <div className="space-y-1">
                      {byDay(d).slice(0, 3).map((e) => (
                        <button
                          key={`${e.id}-${e.date}-${e.startTime}`}
                          onClick={() => setSelected(e)}
                          className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold text-white transition hover:opacity-85"
                          style={{ background: STATUS_COLOR[eventKind(e)] }}
                          title={e.title}
                        >
                          {fmtTime(e.startTime).replace(" ", "")} {e.title}
                        </button>
                      ))}
                      {byDay(d).length > 3 && <div className="px-1 text-[10px] font-medium text-ink3">+{byDay(d).length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {LEGEND.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[l.key] }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* event popover */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="card fade-up relative w-full max-w-md p-6">
            <button aria-label="Close" onClick={() => setSelected(null)} className="absolute right-4 top-4 text-ink3 hover:text-ink">
              <X size={18} />
            </button>
            <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: STATUS_COLOR[eventKind(selected)] }}>
              {LEGEND.find((l) => l.key === eventKind(selected))?.label}
            </span>
            <h3 className="pr-6 text-lg font-bold leading-snug text-ink">{selected.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink3">{selected.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink2">
              <li className="flex items-center gap-2.5"><Clock size={14} className="text-ink3" /> {fmtDate(selected.date)} · {fmtTime(selected.startTime)} – {fmtTime(selected.endTime)}</li>
              <li className="flex items-center gap-2.5">{selected.platform === "Physical Meeting" ? <MapPin size={14} className="text-ink3" /> : <Video size={14} className="text-ink3" />} {selected.platform === "Physical Meeting" ? selected.venue : selected.platform}</li>
              <li className="flex items-center gap-2.5"><User size={14} className="text-ink3" /> {selected.trainer}</li>
            </ul>
            <Link
              href={`/events/${selected.id}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            >
              Full details, registration & Notify Me <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
