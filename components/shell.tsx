"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, CalendarDays, GraduationCap, Users, BarChart3, Bell, Settings,
  Search, Sun, Moon, LogOut, Menu, X, Award, BookOpen,
} from "lucide-react";
import { Avatar } from "./ui";

type ShellUser = { id: string; name: string; role: string; title: string };

const NAV: Record<string, { href: string; label: string; icon: any }[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/trainers", label: "Trainers", icon: Users },
    { href: "/trainees", label: "Trainees", icon: GraduationCap },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  trainer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "My Events", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
  trainee: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Trainings", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/certificates", label: "Certificates", icon: Award },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
};

export function NNLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white dark:bg-primary">
        <GraduationCap size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-brand">novo nordisk</span>
          <span className="block text-[11px] font-medium text-ink3">Learning Hub</span>
        </span>
      )}
    </span>
  );
}

function ThemeToggle() {
  const [, force] = useState(0);
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return (
    <button
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink2 transition hover:bg-surface2"
      onClick={() => {
        const el = document.documentElement;
        el.classList.toggle("dark");
        localStorage.setItem("nn-theme", el.classList.contains("dark") ? "dark" : "light");
        force((n) => n + 1);
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export default function Shell({
  user,
  unread,
  children,
}: {
  user: ShellUser;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = NAV[user.role] ?? NAV.trainee;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const links = (
    <nav className="flex flex-col gap-1 px-3">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-navy text-white shadow-sm dark:bg-primary"
                : "text-ink2 hover:bg-surface2 hover:text-ink"
            }`}
          >
            <Icon size={17} strokeWidth={2.1} />
            {label}
            {label === "Notifications" && unread > 0 && (
              <span className="ml-auto rounded-full bg-crit px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Link href="/dashboard"><NNLogo /></Link>
        </div>
        {links}
        <div className="mt-auto border-t border-line p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
              <div className="truncate text-xs capitalize text-ink3">{user.role} · {user.title}</div>
            </div>
            <button aria-label="Sign out" onClick={logout} className="text-ink3 transition hover:text-crit">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface pt-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-5">
              <NNLogo />
              <button aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} className="text-ink2" /></button>
            </div>
            {links}
            <div className="mt-auto border-t border-line p-4">
              <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-crit">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* topbar */}
      <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6 lg:ml-60">
        <button aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
          <Menu size={22} className="text-ink2" />
        </button>
        <form
          className="relative max-w-md flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/events?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trainings, trainers, categories…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink2 transition hover:bg-surface2"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crit px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:ml-60">{children}</main>
    </div>
  );
}
