"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Avatar } from "./ui";

type Row = { userId: string; name: string; department: string; attended: boolean | null };

export default function AttendancePanel({ eventId, rows }: { eventId: string; rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  const mark = async (userId: string, attended: boolean | null) => {
    setBusy(userId);
    await fetch(`/api/events/${eventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, attended }),
    });
    setBusy("");
    router.refresh();
  };

  return (
    <ul className="divide-y divide-line/70">
      {rows.map((r) => (
        <li key={r.userId} className="flex items-center gap-3 py-2.5">
          <Avatar name={r.name} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{r.name}</div>
            <div className="truncate text-xs text-ink3">{r.department}</div>
          </div>
          <div className="flex gap-1.5">
            <button
              aria-label={`Mark ${r.name} attended`}
              disabled={busy === r.userId}
              onClick={() => mark(r.userId, r.attended === true ? null : true)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                r.attended === true ? "border-ok bg-ok text-white" : "border-line text-ink3 hover:border-ok hover:text-ok"
              }`}
            >
              <Check size={14} />
            </button>
            <button
              aria-label={`Mark ${r.name} absent`}
              disabled={busy === r.userId}
              onClick={() => mark(r.userId, r.attended === false ? null : false)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                r.attended === false ? "border-crit bg-crit text-white" : "border-line text-ink3 hover:border-crit hover:text-crit"
              }`}
            >
              <X size={14} />
            </button>
          </div>
        </li>
      ))}
      {!rows.length && <li className="py-4 text-center text-xs text-ink3">No registrations yet.</li>}
    </ul>
  );
}
