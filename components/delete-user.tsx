"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteUser({
  endpoint,
  name,
  warning,
  redirectTo,
}: {
  endpoint: string;
  name: string;
  warning: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const doDelete = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(endpoint, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Delete failed.");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  };

  if (!confirming) {
    return (
      <button
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        onClick={() => setConfirming(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-crit transition hover:border-crit hover:bg-crit/10"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setConfirming(false)} />
      <div className="card fade-up relative w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-ink">Delete {name}?</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink2">{warning}</p>
        {error && <p className="mt-3 rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink2 transition hover:bg-surface2"
          >
            Keep
          </button>
          <button
            onClick={doDelete}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-crit px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />} Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
