import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  const db = await getDb();
  const user = db.users.find((u) => u.id === sessionUser.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (user.password !== currentPassword) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }
  const next = String(newPassword ?? "");
  if (next.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (next === currentPassword) {
    return NextResponse.json({ error: "Choose a password different from your current one." }, { status: 400 });
  }

  user.password = next;
  user.mustChangePassword = false;
  audit(db, user.name, "account.password_changed", user.name);
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
