"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check } from "lucide-react";

/** Per-session Outlook (.ics) download button. Shows a green tick once the
 *  invitation has been downloaded on this device. */
export default function SessionIcs({ eventId, sessionId }: { eventId: string; sessionId: string }) {
  const key = `nn-ics-${eventId}-${sessionId}`;
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(key)) setDownloaded(true);
    } catch {}
  }, [key]);

  const download = () => {
    const a = document.createElement("a");
    a.href = `/api/events/${eventId}/ics?session=${encodeURIComponent(sessionId)}`;
    a.download = "";
    a.click();
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setDownloaded(true);
  };

  return (
    <button
      onClick={download}
      title={downloaded ? "Invitation downloaded — click to download again" : "Download Outlook calendar invitation for this session"}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
        downloaded
          ? "border-ok/40 bg-ok/10 text-ok"
          : "border-line text-ink2 hover:bg-surface2"
      }`}
    >
      {downloaded ? (
        <>
          <Check size={13} strokeWidth={3} /> Downloaded
        </>
      ) : (
        <>
          <CalendarPlus size={13} /> Outlook
        </>
      )}
    </button>
  );
}
