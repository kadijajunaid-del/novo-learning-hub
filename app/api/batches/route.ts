import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const name = String((await req.json()).name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Batch name is required." }, { status: 400 });
  if (db.settings.batches.includes(name)) return NextResponse.json({ error: "A batch with this name already exists." }, { status: 409 });

  db.settings.batches.push(name);
  audit(db, user.name, "batch.created", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!db.settings.batches.includes(name)) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  // Assign / clear the team leader for this batch.
  if ("leaderId" in body) {
    const leaderId = String(body.leaderId ?? "");
    if (leaderId && db.users.some((u) => u.id === leaderId && u.role === "team_leader")) {
      db.settings.batchLeaders[name] = leaderId;
    } else {
      delete db.settings.batchLeaders[name];
    }
  }

  // Add trainees to this batch (moves them from any previous batch).
  if (Array.isArray(body.addTraineeIds)) {
    for (const id of body.addTraineeIds) {
      const t = db.users.find((u) => u.id === id && u.role === "trainee");
      if (t) t.batch = name;
    }
  }
  // Remove trainees from this batch.
  if (Array.isArray(body.removeTraineeIds)) {
    for (const id of body.removeTraineeIds) {
      const t = db.users.find((u) => u.id === id && u.role === "trainee");
      if (t && t.batch === name) t.batch = "";
    }
  }

  // Optional rename: carry the leader mapping and trainee membership across.
  if (typeof body.rename === "string" && body.rename.trim() && body.rename.trim() !== name) {
    const next = body.rename.trim();
    if (db.settings.batches.includes(next)) return NextResponse.json({ error: "Another batch already uses that name." }, { status: 409 });
    db.settings.batches = db.settings.batches.map((b) => (b === name ? next : b));
    if (db.settings.batchLeaders[name]) {
      db.settings.batchLeaders[next] = db.settings.batchLeaders[name];
      delete db.settings.batchLeaders[name];
    }
    for (const u of db.users) if (u.role === "trainee" && u.batch === name) u.batch = next;
  }

  audit(db, user.name, "batch.updated", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const name = String((await req.json()).name ?? "").trim();
  if (!db.settings.batches.includes(name)) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  db.settings.batches = db.settings.batches.filter((b) => b !== name);
  delete db.settings.batchLeaders[name];
  for (const u of db.users) if (u.role === "trainee" && u.batch === name) u.batch = "";
  audit(db, user.name, "batch.deleted", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
