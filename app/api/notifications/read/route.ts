import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { notificationsFor } from "@/lib/queries";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  for (const n of notificationsFor(db, user)) {
    if (!n.readBy.includes(user.id)) n.readBy.push(user.id);
  }
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
