import type { ReactNode } from "react";
import Link from "next/link";
import { initials } from "@/lib/format";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

const badgeTones: Record<string, string> = {
  blue: "bg-primary-soft text-primary-strong",
  green: "bg-ok/12 text-ok",
  orange: "bg-serious/15 text-serious dark:text-[#f2a081]",
  red: "bg-crit/12 text-crit",
  gray: "bg-surface2 text-ink2",
  navy: "bg-brand/10 text-brand dark:bg-primary-soft dark:text-brand",
};

export function Badge({ tone = "gray", children }: { tone?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone] ?? badgeTones.gray}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string, date?: string): { tone: string; label: string } {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (status === "cancelled") return { tone: "red", label: "Cancelled" };
  if (status === "completed") return { tone: "green", label: "Completed" };
  if (status === "draft") return { tone: "gray", label: "Draft" };
  if (date === todayIso) return { tone: "blue", label: "Today" };
  if (date && date < todayIso) return { tone: "green", label: "Finished" };
  return { tone: "orange", label: "Upcoming" };
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "var(--primary)",
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
  href?: string;
}) {
  const inner = (
    <>
      {icon && (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: accent }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-ink2">{label}</div>
        <div className="mt-0.5 text-[26px] font-bold leading-8 tracking-tight text-ink">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-ink3">{sub}</div>}
      </div>
    </>
  );
  const cls = "card card-hover fade-up flex items-start gap-4 p-5";
  return href ? (
    <Link href={href} className={cls} aria-label={`${label} — view details`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-ink3">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const avatarPalette = ["#005ad2", "#0d7a56", "#8a5a00", "#4a3aa7", "#a83a67", "#00429e"];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const hue = avatarPalette[(name.charCodeAt(0) + name.length) % avatarPalette.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
      <div className="text-ink3">{icon}</div>
      <div className="text-sm font-semibold text-ink2">{title}</div>
      {sub && <div className="max-w-sm text-xs text-ink3">{sub}</div>}
    </div>
  );
}
