"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Copy, Loader2, Pencil, Send, XCircle } from "lucide-react";

export default function EventActions({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const act = async (action: string) => {
    setBusy(action);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusy("");
    setConfirmCancel(false);
    if (action === "duplicate" && data.id) {
      router.push(`/events/${data.id}/edit`);
    }
    router.refresh();
  };

  const btn = "inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2 disabled:opacity-60";

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <button onClick={() => act("publish")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60">
          {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publish event
        </button>
      )}
      {status !== "cancelled" && status !== "completed" && (
        <Link href={`/events/${eventId}/edit`} className={btn}>
          <Pencil size={14} /> Edit
        </Link>
      )}
      <button onClick={() => act("duplicate")} disabled={!!busy} className={btn}>
        {busy === "duplicate" ? <Loader2 size={15} className="animate-spin" /> : <Copy size={14} />} Duplicate
      </button>
      {status === "published" && (
        <button onClick={() => act("complete")} disabled={!!busy} className={btn}>
          {busy === "complete" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={14} className="text-ok" />} Mark completed
        </button>
      )}
      {status === "published" && !confirmCancel && (
        <button onClick={() => setConfirmCancel(true)} className="inline-flex items-center gap-2 rounded-xl border border-crit/40 px-4 py-2.5 text-sm font-semibold text-crit transition hover:bg-crit/10">
          <XCircle size={14} /> Cancel event
        </button>
      )}
      {confirmCancel && (
        <span className="inline-flex items-center gap-2 rounded-xl bg-crit/10 px-3 py-2 text-xs font-semibold text-crit">
          Cancel this event and notify registrants?
          <button onClick={() => act("cancel")} disabled={!!busy} className="rounded-lg bg-crit px-2.5 py-1 text-white">
            {busy === "cancel" ? "…" : "Yes, cancel"}
          </button>
          <button onClick={() => setConfirmCancel(false)} className="underline">Keep it</button>
        </span>
      )}
    </div>
  );
}
