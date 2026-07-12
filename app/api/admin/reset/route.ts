import { NextResponse } from "next/server";
import { saveDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildSeed } from "@/lib/seed";

/** Wipes all platform data back to a clean slate (accounts + settings only). */
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  await saveDb(buildSeed());
  return NextResponse.json({ ok: true });
}
