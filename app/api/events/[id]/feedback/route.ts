import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uid } from "@/lib/format";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const { rating, comment } = await req.json();
  const r = Math.max(1, Math.min(5, Number(rating)));
  const existing = db.feedback.find((f) => f.eventId === id && f.userId === user.id);
  if (existing) {
    existing.rating = r;
    existing.comment = String(comment ?? "");
    existing.at = new Date().toISOString();
  } else {
    db.feedback.push({ id: uid("fb"), eventId: id, userId: user.id, rating: r, comment: String(comment ?? ""), at: new Date().toISOString() });
  }
  audit(db, user.name, "feedback.submitted", `${event.title} — ${r}/5`);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
