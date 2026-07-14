"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2, Pencil, Plus, X } from "lucide-react";
import { Avatar, Badge } from "./ui";
import DeleteUser from "./delete-user";

export type TraineeRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  batch: string;
  active: boolean;
  joined: string;
  registered: number;
  attended: number;
  missed: number;
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function TraineeManager({
  trainees,
  departments,
  batches,
  isAdmin,
}: {
  trainees: TraineeRow[];
  departments: string[];
  batches: string[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<TraineeRow | null>(null);
  const [f, setF] = useState({ name: "", email: "", department: departments[0] ?? "", title: "", batch: batches[0] ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const openCreate = () => {
    setF({ name: "", email: "", department: departments[0] ?? "", title: "", batch: batches[0] ?? "" });
    setError("");
    setModal("create");
  };
  const openEdit = (t: TraineeRow) => {
    setEditing(t);
    setF({ name: t.name, email: t.email, department: t.department, title: t.title, batch: t.batch || batches[0] || "" });
    setError("");
    setModal("edit");
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(modal === "create" ? "/api/trainees" : `/api/trainees/${editing!.id}`, {
      method: modal === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed.");
      return;
    }
    if (modal === "create") setNotice("Trainee created. Temporary password: Trainee@123.");
    setModal(null);
    router.refresh();
  };

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong"
          >
            <Plus size={16} /> Create trainee
          </button>
        </div>
      )}

      {notice && (
        <p className="mb-4 rounded-xl bg-ok/10 px-4 py-2.5 text-xs font-medium text-ok">
          {notice} <button className="ml-2 underline" onClick={() => setNotice("")}>Dismiss</button>
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
              <th className="px-5 py-3.5 font-semibold">Employee</th>
              <th className="px-5 py-3.5 font-semibold">Batch</th>
              <th className="px-5 py-3.5 font-semibold">Department</th>
              <th className="px-5 py-3.5 font-semibold">Registered</th>
              <th className="px-5 py-3.5 font-semibold">Attended</th>
              <th className="px-5 py-3.5 font-semibold">Missed</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map((t) => (
              <tr key={t.id} className="border-b border-line/60 transition last:border-0 hover:bg-surface2/50">
                <td className="px-5 py-3.5">
                  <Link href={`/trainees/${t.id}`} className="group flex items-center gap-3">
                    <Avatar name={t.name} size={34} />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink group-hover:text-primary">{t.name}</div>
                      <div className="truncate text-xs text-ink3">{t.title} · {t.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  {t.batch ? <Badge tone="blue">{t.batch}</Badge> : <span className="text-xs text-ink3">—</span>}
                </td>
                <td className="px-5 py-3.5 text-ink2">{t.department}</td>
                <td className="px-5 py-3.5 font-semibold text-ink">{t.registered}</td>
                <td className="px-5 py-3.5 text-ok">{t.attended}</td>
                <td className="px-5 py-3.5 text-crit">{t.missed}</td>
                <td className="px-5 py-3.5">{t.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/trainees/${t.id}`}
                      aria-label={`View ${t.name}`}
                      title={`View ${t.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink2 transition hover:bg-surface2"
                    >
                      <ChevronRight size={15} />
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          aria-label={`Edit ${t.name}`}
                          title={`Edit ${t.name}`}
                          onClick={() => openEdit(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink2 transition hover:bg-surface2"
                        >
                          <Pencil size={14} />
                        </button>
                        <DeleteUser
                          endpoint={`/api/trainees/${t.id}`}
                          name={t.name}
                          warning="This permanently removes the account together with all registrations and feedback. This cannot be undone."
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!trainees.length && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-ink3">No trainees match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="card fade-up relative w-full max-w-md p-6">
            <button aria-label="Close" onClick={() => setModal(null)} className="absolute right-4 top-4 text-ink3 hover:text-ink"><X size={18} /></button>
            <h3 className="text-lg font-bold text-ink">{modal === "create" ? "Create trainee" : `Edit ${editing?.name}`}</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Full name</label>
                <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Aisha Rahman" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Work email</label>
                <input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="aisha.rahman@novonordisk.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink2">Batch</label>
                <select className={inputCls} value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}>
                  {batches.map((b) => <option key={b}>{b}</option>)}
                </select>
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
                  <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="New Hire" />
                </div>
              </div>
              {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
              <button
                onClick={submit}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {modal === "create" ? "Create trainee account" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
