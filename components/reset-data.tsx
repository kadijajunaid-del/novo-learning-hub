"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export default function ResetData() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    await fetch("/api/admin/reset", { method: "POST" });
    setBusy(false);
    setConfirming(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="card border-crit/30 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crit/10 text-crit">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">Reset platform data</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-ink3">
            Permanently deletes every event, registration, notification and feedback entry, and removes all users except the admin, trainer and trainee sign-in accounts. Settings are kept.
          </p>
        </div>
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-crit/40 px-4 py-2.5 text-sm font-semibold text-crit transition hover:bg-crit/10"
        >
          <Trash2 size={14} /> Reset all data
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setConfirming(false)} />
          <div className="card fade-up relative w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-ink">Erase all platform data?</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink2">
              Everything except the three sign-in accounts and the settings will be permanently deleted. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink2 transition hover:bg-surface2"
              >
                Cancel
              </button>
              <button
                onClick={reset}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-crit px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />} Yes, erase everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
