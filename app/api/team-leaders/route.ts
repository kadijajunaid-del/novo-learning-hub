import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uid } from "@/lib/format";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const { name, email, department, title, batches, password } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const id = uid("u");
  db.users.push({
    id,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: password || "Leader@123",
    role: "team_leader",
    department: department || db.settings.departments[0],
    title: title || "Team Leader",
    active: true,
    joined: new Date().toISOString().slice(0, 10),
  });

  // Assign selected batches to this leader (each batch has one leader).
  if (Array.isArray(batches)) {
    for (const b of batches) {
      if (db.settings.batches.includes(b)) db.settings.batchLeaders[b] = id;
    }
  }
  audit(db, user.name, "team_leader.created", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
