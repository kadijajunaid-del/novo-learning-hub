import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const leader = db.users.find((u) => u.id === id && u.role === "team_leader");
  if (!leader) return NextResponse.json({ error: "Team leader not found." }, { status: 404 });

  const body = await req.json();
  if (body.action === "toggle") {
    leader.active = !leader.active;
    audit(db, admin.name, leader.active ? "team_leader.enabled" : "team_leader.disabled", leader.name);
  } else if (body.action === "resetPassword") {
    leader.password = body.password || "Leader@123";
    audit(db, admin.name, "team_leader.password_reset", leader.name);
  } else {
    for (const k of ["name", "email", "department", "title"]) {
      if (body[k]) (leader as any)[k] = String(body[k]).trim();
    }
    if (Array.isArray(body.batches)) {
      // Reset this leader's batches, then assign the selected ones.
      for (const b of Object.keys(db.settings.batchLeaders)) {
        if (db.settings.batchLeaders[b] === id) delete db.settings.batchLeaders[b];
      }
      for (const b of body.batches) {
        if (db.settings.batches.includes(b)) db.settings.batchLeaders[b] = id;
      }
    }
    audit(db, admin.name, "team_leader.updated", leader.name);
  }
  await saveDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const idx = db.users.findIndex((u) => u.id === id && u.role === "team_leader");
  if (idx === -1) return NextResponse.json({ error: "Team leader not found." }, { status: 404 });
  const name = db.users[idx].name;

  db.users.splice(idx, 1);
  db.notifications = db.notifications.filter((n) => n.to !== id);
  // Unassign their batches (they become leaderless until reassigned).
  for (const b of Object.keys(db.settings.batchLeaders)) {
    if (db.settings.batchLeaders[b] === id) delete db.settings.batchLeaders[b];
  }
  audit(db, admin.name, "team_leader.deleted", name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
