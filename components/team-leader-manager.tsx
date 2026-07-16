"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Pencil, Plus, Power, X } from "lucide-react";
import { Avatar, Badge } from "./ui";
import DeleteUser from "./delete-user";

export type LeaderRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  active: boolean;
  batches: string[];
  traineeCount: number;
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function TeamLeaderManager({
  leaders,
  departments,
  batches,
  batchOwner,
}: {
  leaders: LeaderRow[];
  departments: string[];
  batches: string[];
  /** batch → leader id, so we can warn when reassigning a batch. */
  batchOwner: Record<string, string>;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<LeaderRow | null>(null);
  const [f, setF] = useState({ name: "", email: "", department: departments[0] ?? "", title: "Team Leader", batches: [] as string[] });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const openCreate = () => {
    setF({ name: "", email: "", department: departments[0] ?? "", title: "Team Leader", batches: [] });
    setError("");
    setModal("create");
  };
  const openEdit = (l: LeaderRow) => {
    setEditing(l);
    setF({ name: l.name, email: l.email, department: l.department, title: l.title, batches: l.batches });
    setError("");
    setModal("edit");
  };
  const toggleBatch = (b: string) =>
    setF((p) => ({ ...p, batches: p.batches.includes(b) ? p.batches.filter((x) => x !== b) : [...p.batches, b] }));

  const submit = async () => {
    setBusy("save");
    setError("");
    const res = await fetch(modal === "create" ? "/api/team-leaders" : `/api/team-leaders/${editing!.id}`, {
      method: modal === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) {
      setError(data.error ?? "Failed.");
      return;
    }
    if (modal === "create") setNotice("Team leader created. Temporary password: Leader@123.");
    setModal(null);
    router.refresh();
  };

  const act = async (id: string, action: "toggle" | "resetPassword") => {
    setBusy(id + action);
    await fetch(`/api/team-leaders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy("");
    if (action === "resetPassword") setNotice("Password reset to Leader@123 and emailed to the team leader.");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong"
        >
          <Plus size={16} /> Create team leader
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-ok/10 px-4 py-2.5 text-xs font-medium text-ok">
          {notice} <button className="ml-2 underline" onClick={() => setNotice("")}>Dismiss</button>
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
              <th className="px-5 py-3.5 font-semibold">Team leader</th>
              <th className="px-5 py-3.5 font-semibold">Batches led</th>
              <th className="px-5 py-3.5 font-semibold">Trainees</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((l) => (
              <tr key={l.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} size={34} />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{l.name}</div>
                      <div className="truncate text-xs text-ink3">{l.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {l.batches.length ? l.batches.map((b) => <Badge key={b} tone="blue">{b}</Badge>) : <span className="text-xs text-ink3">None</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-semibold text-ink">{l.traineeCount}</td>
                <td className="px-5 py-3.5">{l.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <IconBtn label={`Edit ${l.name}`} onClick={() => openEdit(l)}><Pencil size={14} /></IconBtn>
                    <IconBtn label={`Reset password for ${l.name}`} onClick={() => act(l.id, "resetPassword")} busy={busy === l.id + "resetPassword"}><KeyRound size={14} /></IconBtn>
                    <IconBtn label={l.active ? `Disable ${l.name}` : `Enable ${l.name}`} tone={l.active ? "danger" : "ok"} onClick={() => act(l.id, "toggle")} busy={busy === l.id + "toggle"}><Power size={14} /></IconBtn>
                    <DeleteUser
                      endpoint={`/api/team-leaders/${l.id}`}
                      name={l.name}
                      warning="This removes the team leader account. Their batches become unassigned until you give them to another leader."
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!leaders.length && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-ink3">No team leaders yet. Create one and assign batches.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="card fade-up relative w-full max-w-md p-6">
            <button aria-label="Close" onClick={() => setModal(null)} className="absolute right-4 top-4 text-ink3 hover:text-ink"><X size={18} /></button>
            <h3 className="text-lg font-bold text-ink">{modal === "create" ? "Create team leader" : `Edit ${editing?.name}`}</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Full name</label>
                <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Fatima Noor" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Work email</label>
                <input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="fatima.noor@cdcturkiye.org" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink2">Department</label>
                  <select className={inputCls} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}>
                    {departments.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink2">Job title</label>
                  <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Team Leader" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Assigned batches</label>
                <div className="flex flex-wrap gap-2">
                  {batches.map((b) => {
                    const on = f.batches.includes(b);
                    const otherOwner = batchOwner[b] && batchOwner[b] !== editing?.id;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBatch(b)}
                        title={otherOwner && !on ? "Currently led by another team leader — selecting reassigns it" : undefined}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          on ? "border-primary bg-primary text-white" : "border-line text-ink2 hover:bg-surface2"
                        }`}
                      >
                        {on ? "✓ " : ""}{b}{otherOwner && !on ? " •" : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink3">Each batch has one team leader. A “•” marks a batch already led by someone else — selecting it reassigns it.</p>
              </div>
              {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
              <button
                onClick={submit}
                disabled={busy === "save"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
              >
                {busy === "save" && <Loader2 size={15} className="animate-spin" />}
                {modal === "create" ? "Create team leader account" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, busy, tone }: { children: React.ReactNode; label: string; onClick: () => void; busy?: boolean; tone?: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={busy}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-line transition disabled:opacity-50 ${
        tone === "danger" ? "text-crit hover:border-crit hover:bg-crit/10" : tone === "ok" ? "text-ok hover:border-ok hover:bg-ok/10" : "text-ink2 hover:bg-surface2"
      }`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
