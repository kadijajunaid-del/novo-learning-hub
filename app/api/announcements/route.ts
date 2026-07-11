import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uid } from "@/lib/format";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { title, body, to } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "Title and message are required." }, { status: 400 });

  const db = await getDb();
  db.notifications.unshift({
    id: uid("nt"),
    to: ["all", "trainers", "trainees"].includes(to) ? to : "all",
    title: String(title).trim(),
    body: String(body).trim(),
    kind: "announcement",
    at: new Date().toISOString(),
    readBy: [],
  });
  audit(db, user.name, "announcement.sent", title);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
