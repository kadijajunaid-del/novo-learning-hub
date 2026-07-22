"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";

/**
 * Per-session delivery status. The session's trainer sees Accept / Mark
 * completed; everyone managing the event sees the status. `role` controls
 * which buttons show: "trainer" (owns the session) or "view" (read-only badge).
 */
export default function SessionStatus({
  eventId,
  sessionId,
  accepted,
  completed,
  mode,
}: {
  eventId: string;
  sessionId: string;
  accepted: boolean;
  completed: boolean;
  mode: "trainer" | "view";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  const act = async (action: string) => {
    setBusy(action);
    await fetch(`/api/events/${eventId}/sessions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action }),
    });
    setBusy("");
    router.refresh();
  };

  const badge = (text: string, tone: "green" | "blue" | "gray") => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        tone === "green" ? "bg-ok/12 text-ok" : tone === "blue" ? "bg-primary-soft text-primary-strong dark:text-primary" : "bg-surface2 text-ink2"
      }`}
    >
      {tone === "green" && <CheckCircle2 size={11} />}
      {text}
    </span>
  );

  // Read-only view (admin/owner looking at another trainer's session).
  if (mode === "view") {
    if (completed) return badge("Completed", "green");
    if (accepted) return badge("Accepted", "blue");
    return badge("Awaiting trainer", "gray");
  }

  // The session's own trainer.
  if (completed) {
    return (
      <span className="inline-flex items-center gap-2">
        {badge("Completed", "green")}
        <button onClick={() => act("reopen")} disabled={!!busy} className="text-[11px] font-medium text-ink3 underline hover:text-ink">
          reopen
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      {!accepted ? (
        <button
          onClick={() => act("accept")}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary-soft disabled:opacity-60"
        >
          {busy === "accept" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Accept to deliver
        </button>
      ) : (
        <>
          {badge("Accepted", "blue")}
          <button onClick={() => act("decline")} disabled={!!busy} className="text-ink3 transition hover:text-crit" title="Withdraw acceptance">
            <X size={13} />
          </button>
        </>
      )}
      {accepted && (
        <button
          onClick={() => act("complete")}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ok px-3 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy === "complete" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark completed
        </button>
      )}
    </span>
  );
}
