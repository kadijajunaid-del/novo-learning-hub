"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (em: string, pw: string) => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: em, password: pw }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Sign-in failed.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-[#00247e] to-[#0053b8] p-4 dark:from-[#040a1c] dark:via-[#081538] dark:to-[#0a2050]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
            <GraduationCap size={30} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">novo nordisk</h1>
            <p className="text-sm font-medium text-blue-200">Learning Hub</p>
          </div>
        </div>

        <div className="glass card fade-up border-white/20 p-7 !bg-white/95 dark:!bg-[#101b30]/90">
          <h2 className="text-lg font-bold text-ink">Sign in to your account</h2>
          <p className="mt-1 text-sm text-ink3">Employee training & event management portal</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Work email</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@novonordisk.com"
                  className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink2">Password</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}
            {info && <p className="rounded-lg bg-primary-soft px-3 py-2 text-xs font-medium text-primary-strong">{info}</p>}

            <button
              type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />} Sign in
            </button>

            <button
              type="button"
              onClick={() => setInfo("A one-time passcode (OTP) has been sent to your registered email. Follow the link in that email to reset your password.")}
              className="w-full text-center text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
