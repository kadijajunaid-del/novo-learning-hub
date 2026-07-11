"use client";

import { FileText } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2"
    >
      <FileText size={15} /> Export PDF
    </button>
  );
}
