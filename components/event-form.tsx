"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Paperclip, Plus, Trash2, Upload, X } from "lucide-react";
import type { TrainingEvent } from "@/lib/types";

const TIMEZONES = ["Europe/Copenhagen", "Asia/Dubai", "Asia/Riyadh", "Europe/London", "America/New_York", "Asia/Kolkata", "Asia/Singapore"];

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-ink2";

type SessionDraft = {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  platform: string;
  venue: string;
  meetingLink?: string;
};

const emptySession = (): SessionDraft => ({ date: "", startTime: "09:00", endTime: "11:00", platform: "Microsoft Teams", venue: "" });

export default function EventForm({
  categories,
  platforms,
  reminderOptions,
  batches,
  departments,
  trainerName,
  trainers,
  existing,
}: {
  categories: string[];
  platforms: string[];
  reminderOptions: string[];
  batches: string[];
  departments: string[];
  trainerName: string;
  /** Provided for admins only — lets them assign the event to a trainer. */
  trainers?: { id: string; name: string }[];
  existing?: TrainingEvent;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    category: existing?.category ?? categories[0],
    timeZone: existing?.timeZone ?? "Europe/Copenhagen",
    maxParticipants: existing?.maxParticipants ?? 25,
    agenda: existing?.agenda?.join("\n") ?? "",
    prerequisites: existing?.prerequisites ?? "",
    instructions: existing?.instructions ?? "",
    reminder: existing?.reminder ?? "1 hour",
    repeat: existing?.repeat ?? "None",
    visibility: existing?.visibility ?? "Everyone",
    trainerId: existing?.trainerId ?? trainers?.[0]?.id ?? "",
  });
  const [sessions, setSessions] = useState<SessionDraft[]>(
    existing
      ? (existing.sessions?.length
          ? existing.sessions.map((s) => ({ ...s }))
          : [{ date: existing.date, startTime: existing.startTime, endTime: existing.endTime, platform: existing.platform, venue: existing.venue === "Online" ? "" : existing.venue, meetingLink: existing.meetingLink }])
      : [emptySession()],
  );
  const [materials, setMaterials] = useState<{ name: string; size: string }[]>(existing?.materials ?? []);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setSession = (i: number, k: keyof SessionDraft) => (e: React.ChangeEvent<any>) =>
    setSessions((prev) => prev.map((s, n) => (n === i ? { ...s, [k]: e.target.value } : s)));

  const addSession = () =>
    setSessions((prev) => {
      const last = prev[prev.length - 1];
      // Convenience: the next session defaults to the day after the previous one.
      let nextDate = "";
      if (last?.date) {
        const d = new Date(last.date);
        d.setDate(d.getDate() + 1);
        nextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      return [...prev, { ...emptySession(), date: nextDate, startTime: last?.startTime ?? "09:00", endTime: last?.endTime ?? "11:00", platform: last?.platform ?? "Microsoft Teams", venue: last?.venue ?? "" }];
    });

  const removeSession = (i: number) => setSessions((prev) => prev.filter((_, n) => n !== i));

  const submit = async (status: "draft" | "published") => {
    setBusy(status);
    setError("");
    const payload = {
      ...f,
      maxParticipants: Number(f.maxParticipants),
      agenda: f.agenda.split("\n").map((s) => s.trim()).filter(Boolean),
      materials,
      sessions,
      status,
    };
    const res = await fetch(existing ? `/api/events/${existing.id}` : "/api/events", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push(`/events/${data.id ?? existing?.id}`);
    router.refresh();
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...materials];
    for (const file of Array.from(files)) {
      if (!next.some((m) => m.name === file.name)) {
        next.push({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
      }
    }
    setMaterials(next);
  };

  return (
    <div className="card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Training title *</label>
          <input className={inputCls} value={f.title} onChange={set("title")} placeholder="e.g. Training Programme June" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea rows={3} className={inputCls} value={f.description} onChange={set("description")} placeholder="What will participants learn?" />
        </div>
        <div>
          <label className={labelCls}>Trainer</label>
          {trainers?.length ? (
            <select className={inputCls} value={f.trainerId} onChange={set("trainerId")}>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            <input className={`${inputCls} bg-surface2 text-ink3`} value={trainerName} disabled />
          )}
        </div>
        <div>
          <label className={labelCls}>Training category</label>
          <select className={inputCls} value={f.category} onChange={set("category")}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Time zone</label>
          <select className={inputCls} value={f.timeZone} onChange={set("timeZone")}>
            {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Maximum participants</label>
          <input type="number" min={1} className={inputCls} value={f.maxParticipants} onChange={set("maxParticipants")} />
        </div>

        {/* ---------- sessions ---------- */}
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-ink2">
              Sessions * <span className="font-normal text-ink3">— each session is its own meeting with its own link</span>
            </label>
            <span className="text-xs font-semibold text-ink3">{sessions.length} session{sessions.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const online = s.platform !== "Physical Meeting";
              return (
                <div key={i} className="rounded-xl border border-line bg-surface2/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
                      <CalendarDays size={14} className="text-primary" /> Session {i + 1}
                    </span>
                    {sessions.length > 1 && (
                      <button type="button" aria-label={`Remove session ${i + 1}`} onClick={() => removeSession(i)} className="text-ink3 transition hover:text-crit">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className={labelCls}>Date *</label>
                      <input type="date" className={inputCls} value={s.date} onChange={setSession(i, "date")} />
                    </div>
                    <div>
                      <label className={labelCls}>Start *</label>
                      <input type="time" className={inputCls} value={s.startTime} onChange={setSession(i, "startTime")} />
                    </div>
                    <div>
                      <label className={labelCls}>End *</label>
                      <input type="time" className={inputCls} value={s.endTime} onChange={setSession(i, "endTime")} />
                    </div>
                    <div>
                      <label className={labelCls}>Platform</label>
                      <select className={inputCls} value={s.platform} onChange={setSession(i, "platform")}>
                        {platforms.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    {!online && (
                      <div className="sm:col-span-4">
                        <label className={labelCls}>Venue *</label>
                        <input className={inputCls} value={s.venue} onChange={setSession(i, "venue")} placeholder="e.g. HQ Training Room 2" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addSession}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
          >
            <Plus size={15} /> Add session
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-ink3">
            Meeting links for online sessions are generated automatically when the event is published.
          </p>
        </div>

        <div>
          <label className={labelCls}>Reminder</label>
          <select className={inputCls} value={f.reminder} onChange={set("reminder")}>
            {reminderOptions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Repeat programme</label>
          <select className={inputCls} value={f.repeat} onChange={set("repeat")}>
            {["None", "Daily", "Weekly", "Monthly", "Custom"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Visibility</label>
          <select className={inputCls} value={f.visibility} onChange={set("visibility")}>
            <option>Everyone</option>
            {batches.map((b) => <option key={b} value={`Batch: ${b}`}>Batch: {b}</option>)}
            {departments.map((d) => <option key={d} value={`Department: ${d}`}>Department: {d}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Agenda <span className="font-normal text-ink3">(one item per line)</span></label>
          <textarea rows={4} className={inputCls} value={f.agenda} onChange={set("agenda")} placeholder={"Welcome & introductions\nModule 1\nQ&A"} />
        </div>
        <div>
          <label className={labelCls}>Prerequisites</label>
          <input className={inputCls} value={f.prerequisites} onChange={set("prerequisites")} placeholder="None" />
        </div>
        <div>
          <label className={labelCls}>Meeting instructions</label>
          <input className={inputCls} value={f.instructions} onChange={set("instructions")} placeholder="Join 5 minutes early…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Training materials & attachments</label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line py-6 text-center transition hover:border-primary hover:bg-primary-soft/40">
            <Upload size={18} className="text-primary" />
            <span className="text-sm font-medium text-ink2">Click to upload files</span>
            <span className="text-[11px] text-ink3">PDF, PPTX, DOCX, ZIP — up to 25 MB each</span>
            <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>
          {materials.length > 0 && (
            <ul className="mt-3 space-y-2">
              {materials.map((m) => (
                <li key={m.name} className="flex items-center gap-2.5 rounded-lg bg-surface2 px-3 py-2 text-sm">
                  <Paperclip size={14} className="shrink-0 text-primary" />
                  <span className="flex-1 truncate font-medium text-ink">{m.name}</span>
                  <span className="text-xs text-ink3">{m.size}</span>
                  <button type="button" aria-label={`Remove ${m.name}`} onClick={() => setMaterials(materials.filter((x) => x.name !== m.name))} className="text-ink3 hover:text-crit">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}

      <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        <button
          onClick={() => submit("draft")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2 disabled:opacity-60"
        >
          {busy === "draft" && <Loader2 size={15} className="animate-spin" />} Save as draft
        </button>
        <button
          onClick={() => submit("published")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:opacity-60"
        >
          {busy === "published" && <Loader2 size={15} className="animate-spin" />} Publish event
        </button>
      </div>
    </div>
  );
}
