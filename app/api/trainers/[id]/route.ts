import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const trainer = db.users.find((u) => u.id === id && u.role === "trainer");
  if (!trainer) return NextResponse.json({ error: "Trainer not found." }, { status: 404 });

  const body = await req.json();
  if (body.action === "toggle") {
    trainer.active = !trainer.active;
    audit(db, admin.name, trainer.active ? "trainer.enabled" : "trainer.disabled", trainer.name);
  } else if (body.action === "resetPassword") {
    trainer.password = body.password || "Trainer@123";
    audit(db, admin.name, "trainer.password_reset", trainer.name);
  } else {
    for (const k of ["name", "email", "department", "title"]) {
      if (body[k]) (trainer as any)[k] = String(body[k]).trim();
    }
    audit(db, admin.name, "trainer.updated", trainer.name);
  }
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
