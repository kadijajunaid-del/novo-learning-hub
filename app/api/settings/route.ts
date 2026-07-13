import { NextResponse } from "next/server";
import { getDb, saveDb, audit } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const db = await getDb();
  const body = await req.json();

  if (typeof body.maxTrainers === "number") db.settings.maxTrainers = Math.max(1, body.maxTrainers);
  if (typeof body.trainersCanManageSessions === "boolean") db.settings.trainersCanManageSessions = body.trainersCanManageSessions;
  if (Array.isArray(body.departments)) db.settings.departments = body.departments.filter(Boolean);
  if (Array.isArray(body.categories)) db.settings.categories = body.categories.filter(Boolean);
  if (Array.isArray(body.batches)) db.settings.batches = body.batches.filter(Boolean);
  if (body.workingHours) db.settings.workingHours = body.workingHours;
  if (body.brandColor) db.settings.brandColor = body.brandColor;
  if (body.integrations) {
    for (const key of Object.keys(db.settings.integrations)) {
      if (body.integrations[key] && typeof body.integrations[key].enabled === "boolean") {
        (db.settings.integrations as any)[key].enabled = body.integrations[key].enabled;
      }
    }
  }
  audit(db, user.name, "settings.updated", "Admin settings changed");
  await saveDb(db);
  return NextResponse.json({ ok: true });
}
