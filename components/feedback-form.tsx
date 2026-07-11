"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

export default function FeedbackForm({
  eventId,
  existing,
}: {
  eventId: string;
  existing?: { rating: number; comment: string };
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    await fetch(`/api/events/${eventId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    setBusy(false);
    setDone(true);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            <Star
              size={26}
              className={`transition ${(hover || rating) >= n ? "fill-[var(--warn)] text-[var(--warn)]" : "text-ink3"}`}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm font-semibold text-ink2">{rating}/5</span>}
      </div>
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you think of this training and the trainer?"
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-primary"
      />
      <button
        onClick={submit}
        disabled={busy || !rating}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        {done ? "Feedback saved ✓" : existing ? "Update feedback" : "Submit feedback"}
      </button>
    </div>
  );
}
