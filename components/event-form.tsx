"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Upload, X } from "lucide-react";
import type { TrainingEvent } from "@/lib/types";

const TIMEZONES = ["Europe/Copenhagen", "Asia/Dubai", "Asia/Riyadh", "Europe/London", "America/New_York", "Asia/Kolkata", "Asia/Singapore"];

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-ink2";

export default function EventForm({
  categories,
  platforms,
  reminderOptions,
  batches,
  departments,
  trainerName,
  existing,
}: {
  categories: string[];
  platforms: string[];
  reminderOptions: string[];
  batches: string[];
  departments: string[];
  trainerName: string;
  existing?: TrainingEvent;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    category: existing?.category ?? categories[0],
    date: existing?.date ?? "",
    startTime: existing?.startTime ?? "09:00",
    endTime: existing?.endTime ?? "11:00",
    timeZone: existing?.timeZone ?? "Europe/Copenhagen",
    platform: existing?.platform ?? "Microsoft Teams",
    venue: existing?.venue && existing.venue !== "Online" ? existing.venue : "",
    maxParticipants: existing?.maxParticipants ?? 25,
    agenda: existing?.agenda?.join("\n") ?? "",
    prerequisites: existing?.prerequisites ?? "",
    instructions: existing?.instructions ?? "",
    reminder: existing?.reminder ?? "1 hour",
    repeat: existing?.repeat ?? "None",
    visibility: existing?.visibility ?? "Everyone",
  });
  const [materials, setMaterials] = useState<{ name: string; size: string }[]>(existing?.materials ?? []);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (status: "draft" | "published") => {
    setBusy(status);
    setError("");
    const payload = {
      ...f,
      maxParticipants: Number(f.maxParticipants),
      agenda: f.agenda.split("\n").map((s) => s.trim()).filter(Boolean),
      materials,
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

  const online = f.platform !== "Physical Meeting";

  return (
    <div className="card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Training title *</label>
          <input className={inputCls} value={f.title} onChange={set("title")} placeholder="e.g. GxP Fundamentals & Data Integrity" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea rows={3} className={inputCls} value={f.description} onChange={set("description")} placeholder="What will participants learn?" />
        </div>
        <div>
          <label className={labelCls}>Trainer</label>
          <input className={`${inputCls} bg-surface2 text-ink3`} value={trainerName} disabled />
        </div>
        <div>
          <label className={labelCls}>Training category</label>
          <select className={inputCls} value={f.category} onChange={set("category")}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" className={inputCls} value={f.date} onChange={set("date")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start time *</label>
            <input type="time" className={inputCls} value={f.startTime} onChange={set("startTime")} />
          </div>
          <div>
            <label className={labelCls}>End time *</label>
            <input type="time" className={inputCls} value={f.endTime} onChange={set("endTime")} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Time zone</label>
          <select className={inputCls} value={f.timeZone} onChange={set("timeZone")}>
            {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Meeting platform</label>
          <select className={inputCls} value={f.platform} onChange={set("platform")}>
            {platforms.map((p) => <option key={p}>{p}</option>)}
          </select>
          {online && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink3">
              The {f.platform} meeting link is generated automatically when the event is published.
            </p>
          )}
        </div>
        {!online && (
          <div className="sm:col-span-2">
            <label className={labelCls}>Venue *</label>
            <input className={inputCls} value={f.venue} onChange={set("venue")} placeholder="e.g. HQ Auditorium B, Bagsværd" />
          </div>
        )}
        <div>
          <label className={labelCls}>Maximum participants</label>
          <input type="number" min={1} className={inputCls} value={f.maxParticipants} onChange={set("maxParticipants")} />
        </div>
        <div>
          <label className={labelCls}>Reminder</label>
          <select className={inputCls} value={f.reminder} onChange={set("reminder")}>
            {reminderOptions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Repeat event</label>
          <select className={inputCls} value={f.repeat} onChange={set("repeat")}>
            {["None", "Daily", "Weekly", "Monthly", "Custom"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
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
