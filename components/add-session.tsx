"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-ink2";

export default function AddSession({
  eventId,
  platforms,
  categories,
  defaultCategory,
  nextIndex,
  trainers,
}: {
  eventId: string;
  platforms: string[];
  categories: string[];
  defaultCategory: string;
  nextIndex: number;
  /** Admins pick the session trainer; trainers add for themselves. */
  trainers?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: "",
    trainerId: trainers?.[0]?.id ?? "",
    category: defaultCategory || categories[0] || "Onboarding",
    date: "",
    startTime: "09:00",
    endTime: "11:00",
    platform: "Microsoft Teams",
    venue: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const online = f.platform !== "Physical Meeting";

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/events/${eventId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add the session.");
      return;
    }
    setOpen(false);
    setF({ ...f, name: "", date: "" });
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
      >
        <Plus size={15} /> Add session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setOpen(false)} />
          <div className="card fade-up relative w-full max-w-lg p-6">
            <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-ink3 hover:text-ink"><X size={18} /></button>
            <h3 className="text-lg font-bold text-ink">Add session {nextIndex}</h3>
            <p className="mt-1 text-xs text-ink3">This session becomes its own meeting with its own link.</p>
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Session name</label>
                  <input className={inputCls} value={f.name} onChange={set("name")} placeholder={`Session ${nextIndex}`} />
                </div>
                <div>
                  <label className={labelCls}>Training category</label>
                  <select className={inputCls} value={f.category} onChange={set("category")}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {trainers?.length ? (
                <div>
                  <label className={labelCls}>Session trainer</label>
                  <select className={inputCls} value={f.trainerId} onChange={set("trainerId")}>
                    {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" className={inputCls} value={f.date} onChange={set("date")} />
                </div>
                <div>
                  <label className={labelCls}>Start *</label>
                  <input type="time" className={inputCls} value={f.startTime} onChange={set("startTime")} />
                </div>
                <div>
                  <label className={labelCls}>End *</label>
                  <input type="time" className={inputCls} value={f.endTime} onChange={set("endTime")} />
                </div>
                <div>
                  <label className={labelCls}>Platform</label>
                  <select className={inputCls} value={f.platform} onChange={set("platform")}>
                    {platforms.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {!online && (
                <div>
                  <label className={labelCls}>Venue *</label>
                  <input className={inputCls} value={f.venue} onChange={set("venue")} placeholder="e.g. HQ Training Room 2" />
                </div>
              )}
              {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
              <button
                onClick={submit}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
              >
                {busy && <Loader2 size={15} className="animate-spin" />} Add session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
