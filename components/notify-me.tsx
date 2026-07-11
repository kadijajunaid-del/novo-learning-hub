"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarPlus, CheckCircle2, Copy, Loader2, Video, X } from "lucide-react";

export default function NotifyMe({
  eventId,
  platform,
  registered,
  full,
}: {
  eventId: string;
  platform: string;
  registered: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ meetingLink: string; icsUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const register = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }
    setResult({ meetingLink: data.meetingLink, icsUrl: data.icsUrl });
    // Outlook integration: the calendar invitation downloads automatically.
    const a = document.createElement("a");
    a.href = data.icsUrl;
    a.download = "";
    a.click();
    router.refresh();
  };

  const cancel = async () => {
    setBusy(true);
    await fetch(`/api/events/${eventId}/register`, { method: "DELETE" });
    setBusy(false);
    setResult(null);
    router.refresh();
  };

  if (registered && !result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-ok/10 px-4 py-3 text-sm font-semibold text-ok">
          <CheckCircle2 size={17} /> You are registered for this training.
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/events/${eventId}/ics`} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2">
            <CalendarPlus size={15} /> Add to Outlook Calendar (.ics)
          </a>
          <button onClick={cancel} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-crit/40 px-4 py-2.5 text-sm font-semibold text-crit transition hover:bg-crit/10 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Cancel registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!result && (
        <button
          onClick={register}
          disabled={busy || full}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-strong hover:shadow-primary/35 disabled:opacity-50 sm:w-auto"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <BellRing size={20} />}
          {full ? "Session fully booked" : "Notify Me"}
        </button>
      )}
      {!result && !full && (
        <p className="text-xs leading-relaxed text-ink3">
          One click registers you, creates the {platform === "Physical Meeting" ? "meeting" : `${platform} meeting`}, emails your confirmation and adds the event — with the link, agenda, trainer, attachments and reminder — to your Outlook Calendar.
        </p>
      )}
      {error && <p className="rounded-lg bg-crit/10 px-3 py-2 text-xs font-medium text-crit">{error}</p>}

      {result && (
        <div className="fade-up card border-ok/40 bg-ok/5 p-5">
          <div className="flex items-center gap-2 text-[15px] font-bold text-ok">
            <CheckCircle2 size={20} /> You have successfully registered for this training.
          </div>
          <ul className="mt-3 space-y-1.5 text-[13px] text-ink2">
            <li>✓ Confirmation email sent to your inbox</li>
            <li>✓ Outlook calendar invitation downloaded — open it to add the event with agenda, trainer, attachments and reminder</li>
            {result.meetingLink && <li>✓ {platform} meeting created automatically</li>}
          </ul>
          {result.meetingLink && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a href={result.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong">
                <Video size={15} /> Open meeting link
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.meetingLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2"
              >
                <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
              </button>
              <a href={result.icsUrl} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2">
                <CalendarPlus size={14} /> Download invite again
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
