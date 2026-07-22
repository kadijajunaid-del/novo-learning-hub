"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, UserCog, UserMinus, UserPlus, X } from "lucide-react";
import { Avatar, Badge } from "./ui";

type Person = { id: string; name: string; email: string; department: string; batch?: string };
export type BatchRow = {
  name: string;
  leaderId: string;
  trainees: Person[];
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function BatchManager({
  batches,
  leaders,
  allTrainees,
}: {
  batches: BatchRow[];
  leaders: { id: string; name: string }[];
  allTrainees: Person[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = (batch: string) => {
    setAddingTo(addingTo === batch ? null : batch);
    setPicked([]);
  };
  const togglePick = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const call = async (method: string, body: any, tag: string) => {
    setBusy(tag);
    setError("");
    const res = await fetch("/api/batches", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  };

  const create = async () => {
    if (!newName.trim()) return;
    if (await call("POST", { name: newName.trim() }, "create")) {
      setNewName("");
      setCreating(false);
    }
  };

  // Trainees not already in this batch, for the add dropdown.
  const availableFor = (b: BatchRow) => allTrainees.filter((t) => !b.trainees.some((x) => x.id === t.id));

  return (
    <div>
      {error && <p className="mb-4 rounded-xl bg-crit/10 px-4 py-2.5 text-xs font-medium text-crit">{error}</p>}

      <div className="mb-5 flex justify-end">
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className={`${inputCls} !w-64`}
              placeholder="Team name, e.g. Clinical Ops Q4"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <button onClick={create} disabled={busy === "create"} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60">
              {busy === "create" && <Loader2 size={15} className="animate-spin" />} Create
            </button>
            <button onClick={() => { setCreating(false); setNewName(""); }} className="rounded-xl border border-line px-3 py-2.5 text-ink2 transition hover:bg-surface2"><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong">
            <Plus size={16} /> Create a team
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {batches.map((b) => (
          <div key={b.name} className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-ink">{b.name}</h3>
                <p className="mt-0.5 text-xs text-ink3">{b.trainees.length} trainee{b.trainees.length === 1 ? "" : "s"}</p>
              </div>
              {confirmDelete === b.name ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-crit/10 px-2.5 py-1.5 text-xs font-semibold text-crit">
                  Delete?
                  <button onClick={async () => { if (await call("DELETE", { name: b.name }, "del" + b.name)) setConfirmDelete(null); }} className="rounded bg-crit px-2 py-0.5 text-white">Yes</button>
                  <button onClick={() => setConfirmDelete(null)} className="underline">No</button>
                </span>
              ) : (
                <button aria-label={`Delete ${b.name}`} title="Delete batch" onClick={() => setConfirmDelete(b.name)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-crit transition hover:bg-crit/10">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* team leader */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink2"><UserCog size={13} /> Team leader</label>
              <select
                className={inputCls}
                value={b.leaderId}
                onChange={(e) => call("PATCH", { name: b.name, leaderId: e.target.value }, "leader" + b.name)}
              >
                <option value="">Unassigned</option>
                {leaders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* trainees */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink2">Trainees</span>
                <button onClick={() => openAdd(b.name)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  <UserPlus size={13} /> Add trainees
                </button>
              </div>

              {addingTo === b.name && (() => {
                const options = availableFor(b);
                const allPicked = options.length > 0 && picked.length === options.length;
                return (
                  <div className="mb-3 rounded-xl border border-line bg-surface2/50 p-3">
                    {options.length ? (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-ink3">Select trainees</span>
                          <button
                            onClick={() => setPicked(allPicked ? [] : options.map((t) => t.id))}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            {allPicked ? "Clear all" : "Select all"}
                          </button>
                        </div>
                        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                          {options.map((t) => {
                            const on = picked.includes(t.id);
                            return (
                              <label key={t.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-surface">
                                <input type="checkbox" checked={on} onChange={() => togglePick(t.id)} className="h-4 w-4 shrink-0 accent-[var(--primary)]" />
                                <Avatar name={t.name} size={26} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-ink">{t.name}</span>
                                  <span className="block truncate text-xs text-ink3">{t.department}{t.batch ? ` · currently ${t.batch}` : ""}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-ink3">{picked.length} selected</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setAddingTo(null); setPicked([]); }} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink2 transition hover:bg-surface">Cancel</button>
                            <button
                              disabled={!picked.length || busy === "add" + b.name}
                              onClick={async () => { if (await call("PATCH", { name: b.name, addTraineeIds: picked }, "add" + b.name)) { setPicked([]); setAddingTo(null); } }}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
                            >
                              {busy === "add" + b.name && <Loader2 size={14} className="animate-spin" />}
                              Add {picked.length || ""} trainee{picked.length === 1 ? "" : "s"}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="py-2 text-center text-xs text-ink3">No other trainees to add — everyone is already in this team.</p>
                    )}
                  </div>
                );
              })()}

              {b.trainees.length ? (
                <ul className="divide-y divide-line/70">
                  {b.trainees.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2">
                      <Avatar name={t.name} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{t.name}</div>
                        <div className="truncate text-xs text-ink3">{t.department}</div>
                      </div>
                      <button
                        aria-label={`Remove ${t.name} from batch`}
                        title="Remove from batch"
                        disabled={busy === "rm" + t.id}
                        onClick={() => call("PATCH", { name: b.name, removeTraineeIds: [t.id] }, "rm" + t.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink3 transition hover:border-crit hover:text-crit"
                      >
                        {busy === "rm" + t.id ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-line py-4 text-center text-xs text-ink3">No trainees in this batch yet.</p>
              )}
            </div>
          </div>
        ))}
        {!batches.length && (
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-dashed border-line py-12 text-center">
              <Badge tone="blue">Empty</Badge>
              <p className="mt-2 text-sm font-semibold text-ink2">No batches yet</p>
              <p className="text-xs text-ink3">Create your first batch, then assign a team leader and trainees.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
