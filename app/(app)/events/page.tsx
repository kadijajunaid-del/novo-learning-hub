import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/ui";
import { regsFor } from "@/lib/queries";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; platform?: string; status?: string; when?: string }>;
}) {
  const { q = "", category = "", platform = "", status = "", when = "" } = await searchParams;
  const user = (await getSessionUser())!;
  const db = await getDb();

  let events = db.events;
  if (user.role === "trainee") events = events.filter((e) => e.status === "published" || e.status === "completed");
  if (user.role === "trainer") {
    events = events.filter((e) => e.trainerId === user.id || (e.sessions ?? []).some((s) => s.trainerId === user.id));
  }

  const needle = q.trim().toLowerCase();
  if (needle) {
    events = events.filter((e) => {
      const trainer = db.users.find((u) => u.id === e.trainerId);
      return [e.title, e.description, e.category, e.platform, e.venue, e.date, trainer?.name ?? "", trainer?.department ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }
  if (category) events = events.filter((e) => e.category === category);
  if (platform) events = events.filter((e) => e.platform === platform);
  if (status) events = events.filter((e) => e.status === status);
  // Date window filter used by the dashboard stat cards.
  const today = todayISO();
  if (when === "today") events = events.filter((e) => e.status === "published" && e.date === today);
  else if (when === "upcoming") events = events.filter((e) => e.status === "published" && e.date >= today);
  else if (when === "ahead") events = events.filter((e) => e.status === "published" && e.date > today);

  events = [...events].sort((a, b) => (a.date < b.date ? 1 : -1));
  const upcoming = events.filter((e) => e.status === "published").sort((a, b) => (a.date > b.date ? 1 : -1));
  const rest = events.filter((e) => e.status !== "published");
  const ordered = [...upcoming, ...rest];
  const myRegIds = new Set(db.registrations.filter((r) => r.userId === user.id).map((r) => r.eventId));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">
            {user.role === "trainee" ? "Training catalogue" : user.role === "trainer" ? "My events" : "All events"}
          </h1>
          <p className="mt-1 text-sm text-ink3">{ordered.length} training{ordered.length === 1 ? "" : "s"} {needle && <>matching “{q}”</>}</p>
        </div>
        {(user.role === "admin" || (user.role === "trainer" && db.settings.trainersCanManageSessions !== false)) && (
          <Link href="/events/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong">
            <Plus size={16} /> Create event
          </Link>
        )}
      </div>

      <form method="GET" className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Search</label>
          <input name="q" defaultValue={q} placeholder="Title, trainer, keyword…" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Category</label>
          <select name="category" defaultValue={category} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary">
            <option value="">All categories</option>
            {db.settings.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Platform</label>
          <select name="platform" defaultValue={platform} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary">
            <option value="">All platforms</option>
            {db.settings.platforms.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {user.role !== "trainee" && (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink3">Status</label>
            <select name="status" defaultValue={status} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary">
              <option value="">All statuses</option>
              {["published", "draft", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        )}
        <button className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-primary">Apply</button>
        <Link href="/events" className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink2 transition hover:bg-surface2">Reset</Link>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            trainer={db.users.find((u) => u.id === e.trainerId)}
            registered={myRegIds.has(e.id)}
            seatsTaken={regsFor(db, e.id).length}
          />
        ))}
      </div>
      {!ordered.length && (
        <EmptyState icon={<SearchX size={22} />} title="No trainings match your filters" sub="Try clearing the search or picking a different category." />
      )}
    </div>
  );
}
