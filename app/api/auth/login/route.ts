import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const db = await getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ error: "This account has been disabled. Contact the administrator." }, { status: 403 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role, name: user.name });
}
