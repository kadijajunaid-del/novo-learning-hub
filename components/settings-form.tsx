"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, Mail, MonitorSmartphone, Plus, ShieldCheck, Video, X } from "lucide-react";
import type { Settings } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

const INTEGRATIONS: { key: keyof Settings["integrations"]; label: string; icon: React.ReactNode }[] = [
  { key: "outlook", label: "Microsoft Outlook Calendar", icon: <CalendarCheck size={17} /> },
  { key: "teams", label: "Microsoft Teams", icon: <Video size={17} /> },
  { key: "zoom", label: "Zoom", icon: <Video size={17} /> },
  { key: "meet", label: "Google Meet", icon: <Video size={17} /> },
  { key: "webex", label: "Cisco Webex", icon: <Video size={17} /> },
  { key: "azureAd", label: "Azure AD (Entra ID) SSO", icon: <ShieldCheck size={17} /> },
  { key: "smtp", label: "SMTP Email & Push", icon: <Mail size={17} /> },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [newCat, setNewCat] = useState("");

  const save = async () => {
    setBusy(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  };

  const chipList = (
    items: string[],
    onRemove: (v: string) => void,
  ) => (
    <div className="flex flex-wrap gap-2">
      {items.map((d) => (
        <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink2">
          {d}
          <button aria-label={`Remove ${d}`} onClick={() => onRemove(d)} className="text-ink3 hover:text-crit"><X size={12} /></button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-5 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink3">General</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Number of trainer seats</label>
              <input type="number" min={1} className={inputCls} value={s.maxTrainers}
                onChange={(e) => setS({ ...s, maxTrainers: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Brand colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={s.brandColor} onChange={(e) => setS({ ...s, brandColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface" />
                <span className="text-sm font-mono text-ink2">{s.brandColor}</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Working hours start</label>
              <input type="time" className={inputCls} value={s.workingHours.start}
                onChange={(e) => setS({ ...s, workingHours: { ...s.workingHours, start: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Working hours end</label>
              <input type="time" className={inputCls} value={s.workingHours.end}
                onChange={(e) => setS({ ...s, workingHours: { ...s.workingHours, end: e.target.value } })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink2">Reminder timings</label>
            <div className="flex flex-wrap gap-2">
              {s.reminderOptions.map((r) => (
                <span key={r} className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-strong dark:text-primary">{r}</span>
              ))}
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-line p-4">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-ink">Trainers can create events & sessions</span>
              <p className="mt-0.5 text-xs leading-relaxed text-ink3">
                When off, only administrators create events and schedule their sessions. Trainers still deliver sessions and mark attendance.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={s.trainersCanManageSessions !== false}
              aria-label="Toggle trainer session creation"
              onClick={() => setS({ ...s, trainersCanManageSessions: s.trainersCanManageSessions === false })}
              className={`relative w-10 shrink-0 rounded-full transition ${s.trainersCanManageSessions !== false ? "bg-primary" : "bg-line"}`}
              style={{ height: 22 }}
            >
              <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${s.trainersCanManageSessions !== false ? "left-[20px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="card space-y-5 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink3">Departments & categories</h2>
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink2">Departments</label>
            {chipList(s.departments, (v) => setS({ ...s, departments: s.departments.filter((x) => x !== v) }))}
            <div className="mt-2.5 flex gap-2">
              <input className={inputCls} placeholder="Add department…" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
              <button
                onClick={() => { if (newDept.trim()) { setS({ ...s, departments: [...s.departments, newDept.trim()] }); setNewDept(""); } }}
                className="shrink-0 rounded-xl border border-line px-3 text-ink2 transition hover:bg-surface2" aria-label="Add department"
              ><Plus size={16} /></button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink2">Training categories</label>
            {chipList(s.categories, (v) => setS({ ...s, categories: s.categories.filter((x) => x !== v) }))}
            <div className="mt-2.5 flex gap-2">
              <input className={inputCls} placeholder="Add category…" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button
                onClick={() => { if (newCat.trim()) { setS({ ...s, categories: [...s.categories, newCat.trim()] }); setNewCat(""); } }}
                className="shrink-0 rounded-xl border border-line px-3 text-ink2 transition hover:bg-surface2" aria-label="Add category"
              ><Plus size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink3">Integrations</h2>
        <p className="mb-5 text-xs text-ink3">
          Meeting links, calendar invitations and emails are provisioned through these connectors. In production, each connector holds tenant credentials (Microsoft Graph, Zoom API, Google Workspace, Webex).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map(({ key, label, icon }) => {
            const cfg = s.integrations[key];
            return (
              <div key={key} className="flex items-start gap-3 rounded-xl border border-line p-4">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.enabled ? "bg-primary-soft text-primary" : "bg-surface2 text-ink3"}`}>
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{label}</span>
                    <button
                      role="switch"
                      aria-checked={cfg.enabled}
                      aria-label={`Toggle ${label}`}
                      onClick={() => setS({ ...s, integrations: { ...s.integrations, [key]: { ...cfg, enabled: !cfg.enabled } } })}
                      className={`relative h-5.5 w-10 shrink-0 rounded-full transition ${cfg.enabled ? "bg-primary" : "bg-line"}`}
                      style={{ height: 22 }}
                    >
                      <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${cfg.enabled ? "left-[20px]" : "left-0.5"}`} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink3">{cfg.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm font-semibold text-ok">Settings saved ✓</span>}
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />} Save settings
        </button>
      </div>
    </div>
  );
}
