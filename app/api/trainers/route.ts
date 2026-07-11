import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uid } from "@/lib/format";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const activeTrainers = db.users.filter((u) => u.role === "trainer" && u.active).length;
  if (activeTrainers >= db.settings.maxTrainers) {
    return NextResponse.json({ error: `Trainer limit reached (${db.settings.maxTrainers}). Increase it in Settings.` }, { status: 400 });
  }

  const { name, email, department, title, password } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  db.users.push({
    id: uid("u"),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: password || "Trainer@123",
    role: "trainer",
    department: department || db.settings.departments[0],
    title: title || "Trainer",
    active: true,
    joined: new Date().toISOString().slice(0, 10),
  });
  audit(db, user.name, "trainer.created", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
