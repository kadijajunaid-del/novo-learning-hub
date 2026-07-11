"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function AnnounceForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("all");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    if (!title || !body) return;
    setBusy(true);
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, to }),
    });
    setBusy(false);
    setTitle("");
    setBody("");
    setDone(true);
    setTimeout(() => setDone(false), 3000);
    router.refresh();
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><Megaphone size={16} /></span>
        <div>
          <h2 className="text-sm font-bold text-ink">Send announcement</h2>
          <p className="text-xs text-ink3">Delivered in-app, by email and push notification.</p>
        </div>
      </div>
      <div className="space-y-3">
        <input className={inputCls} placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={3} className={inputCls} placeholder="Message…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center gap-3">
          <select className={`${inputCls} !w-auto`} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="all">Everyone</option>
            <option value="trainers">Trainers only</option>
            <option value="trainees">Trainees only</option>
          </select>
          <button
            onClick={send}
            disabled={busy || !title || !body}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {done ? "Sent ✓" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
