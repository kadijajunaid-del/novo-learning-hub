"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Pencil, Plus, Power, X } from "lucide-react";
import { Avatar, Badge } from "./ui";

export type TrainerRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  active: boolean;
  sessions: number;
  rating: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function TrainerManager({
  trainers,
  departments,
  maxTrainers,
}: {
  trainers: TrainerRow[];
  departments: string[];
  maxTrainers: number;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<TrainerRow | null>(null);
  const [f, setF] = useState({ name: "", email: "", department: departments[0] ?? "", title: "" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeCount = trainers.filter((t) => t.active).length;

  const openCreate = () => {
    setF({ name: "", email: "", department: departments[0] ?? "", title: "" });
    setError("");
    setModal("create");
  };
  const openEdit = (t: TrainerRow) => {
    setEditing(t);
    setF({ name: t.name, email: t.email, department: t.department, title: t.title });
    setError("");
    setModal("edit");
  };

  const submit = async () => {
    setBusy("save");
    setError("");
    const res = await fetch(modal === "create" ? "/api/trainers" : `/api/trainers/${editing!.id}`, {
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
    if (modal === "create") setNotice(`Trainer created. Temporary password: Trainer@123 — they will be asked to change it on first sign-in.`);
    setModal(null);
    router.refresh();
  };

  const act = async (id: string, action: "toggle" | "resetPassword") => {
    setBusy(id + action);
    await fetch(`/api/trainers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy("");
    if (action === "resetPassword") setNotice("Password reset to Trainer@123 and emailed to the trainer.");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink3">
          {activeCount} active of {maxTrainers} configured trainer seats
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong"
        >
          <Plus size={16} /> Create trainer
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-ok/10 px-4 py-2.5 text-xs font-medium text-ok">
          {notice} <button className="ml-2 underline" onClick={() => setNotice("")}>Dismiss</button>
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
              <th className="px-5 py-3.5 font-semibold">Trainer</th>
              <th className="px-5 py-3.5 font-semibold">Department</th>
              <th className="px-5 py-3.5 font-semibold">Sessions</th>
              <th className="px-5 py-3.5 font-semibold">Rating</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((t) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} size={34} />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{t.name}</div>
                      <div className="truncate text-xs text-ink3">{t.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink2">{t.department}</td>
                <td className="px-5 py-3.5 text-ink2">{t.sessions}</td>
                <td className="px-5 py-3.5 text-ink2">{t.rating}</td>
                <td className="px-5 py-3.5">{t.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <IconBtn label={`Edit ${t.name}`} onClick={() => openEdit(t)}><Pencil size={14} /></IconBtn>
                    <IconBtn label={`Reset password for ${t.name}`} onClick={() => act(t.id, "resetPassword")} busy={busy === t.id + "resetPassword"}><KeyRound size={14} /></IconBtn>
                    <IconBtn label={t.active ? `Disable ${t.name}` : `Enable ${t.name}`} tone={t.active ? "danger" : "ok"} onClick={() => act(t.id, "toggle")} busy={busy === t.id + "toggle"}><Power size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="card fade-up relative w-full max-w-md p-6">
            <button aria-label="Close" onClick={() => setModal(null)} className="absolute right-4 top-4 text-ink3 hover:text-ink"><X size={18} /></button>
            <h3 className="text-lg font-bold text-ink">{modal === "create" ? "Create trainer" : `Edit ${editing?.name}`}</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Full name</label>
                <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Anna Holm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Work email</label>
                <input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="anna.holm@novonordisk.com" />
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
                  <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Trainer" />
                </div>
              </div>
              {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
              <button
                onClick={submit}
                disabled={busy === "save"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
              >
                {busy === "save" && <Loader2 size={15} className="animate-spin" />}
                {modal === "create" ? "Create trainer account" : "Save changes"}
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
