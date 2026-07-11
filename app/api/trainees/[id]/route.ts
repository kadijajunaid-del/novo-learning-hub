import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const idx = db.users.findIndex((u) => u.id === id && u.role === "trainee");
  if (idx === -1) return NextResponse.json({ error: "Trainee not found." }, { status: 404 });
  const name = db.users[idx].name;

  // Remove the account and everything attached to it.
  db.users.splice(idx, 1);
  db.registrations = db.registrations.filter((r) => r.userId !== id);
  db.certificates = db.certificates.filter((c) => c.userId !== id);
  db.feedback = db.feedback.filter((f) => f.userId !== id);
  db.notifications = db.notifications.filter((n) => n.to !== id);

  audit(db, admin.name, "trainee.deleted", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
