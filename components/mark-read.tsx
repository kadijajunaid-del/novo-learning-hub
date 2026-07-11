"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";

export default function MarkRead({ unread }: { unread: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!unread) return null;
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/notifications/read", { method: "POST" });
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink2 transition hover:bg-surface2 disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={15} />}
      Mark all as read ({unread})
    </button>
  );
}
