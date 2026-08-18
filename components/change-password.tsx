"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ChangePassword({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("The new passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not change your password.");
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 size={40} className="text-ok" />
        <p className="text-sm font-semibold text-ink">Password changed. Taking you to your dashboard…</p>
      </div>
    );
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink2">{label}</label>
      <div className="relative">
        <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
        <input type="password" required value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={inputCls} />
      </div>
    </div>
  );

  return (
    <form className="space-y-4" onSubmit={submit}>
      {forced && (
        <p className="rounded-lg bg-primary-soft px-3 py-2 text-xs font-medium text-primary-strong dark:text-primary">
          For security, please set your own password before continuing.
        </p>
      )}
      {field("Current password", current, setCurrent, "Your temporary or current password")}
      {field("New password", next, setNext, "At least 8 characters")}
      {field("Confirm new password", confirm, setConfirm, "Re-enter the new password")}
      {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
      >
        {busy && <Loader2 size={15} className="animate-spin" />} Change password
      </button>
      {!forced && (
        <Link href="/dashboard" className="block text-center text-xs font-medium text-ink3 hover:text-primary">
          Cancel
        </Link>
      )}
    </form>
  );
}
