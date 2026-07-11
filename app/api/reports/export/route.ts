import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { regsFor, eventRating, trainerRating, attendancePct } from "@/lib/queries";

function csv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role === "trainee") return new Response("Not allowed", { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "training";
  const db = await getDb();
  let rows: (string | number)[][] = [];
  let name = type;

  if (type === "training") {
    rows = [["Title", "Category", "Trainer", "Date", "Time", "Platform", "Status", "Registered", "Capacity", "Avg Rating"]];
    for (const e of db.events) {
      const t = db.users.find((u) => u.id === e.trainerId);
      rows.push([e.title, e.category, t?.name ?? "", e.date, `${e.startTime}-${e.endTime}`, e.platform, e.status, regsFor(db, e.id).length, e.maxParticipants, eventRating(db, e.id)?.toFixed(1) ?? "—"]);
    }
  } else if (type === "attendance") {
    rows = [["Training", "Date", "Employee", "Department", "Registered At", "Attended"]];
    for (const r of db.registrations) {
      const e = db.events.find((ev) => ev.id === r.eventId);
      const u = db.users.find((us) => us.id === r.userId);
      if (!e || !u) continue;
      rows.push([e.title, e.date, u.name, u.department, r.at.slice(0, 10), r.attended === null ? "Pending" : r.attended ? "Yes" : "No"]);
    }
  } else if (type === "trainers") {
    rows = [["Trainer", "Department", "Status", "Sessions Delivered", "Total Registrations", "Attendance %", "Avg Rating"]];
    for (const t of db.users.filter((u) => u.role === "trainer")) {
      const evs = db.events.filter((e) => e.trainerId === t.id && e.status !== "draft");
      const evIds = evs.map((e) => e.id);
      const regs = db.registrations.filter((r) => evIds.includes(r.eventId));
      rows.push([t.name, t.department, t.active ? "Active" : "Disabled", evs.filter((e) => e.status === "completed").length, regs.length, attendancePct(db, evIds) ?? "—", trainerRating(db, t.id)?.toFixed(1) ?? "—"]);
    }
  } else if (type === "participation") {
    rows = [["Employee", "Department", "Registered", "Attended", "Missed"]];
    for (const u of db.users.filter((x) => x.role === "trainee")) {
      const regs = db.registrations.filter((r) => r.userId === u.id);
      rows.push([u.name, u.department, regs.length, regs.filter((r) => r.attended === true).length, regs.filter((r) => r.attended === false).length]);
    }
  } else if (type === "certificates") {
    rows = [["Certificate Code", "Employee", "Training", "Issued"]];
    for (const c of db.certificates) {
      const u = db.users.find((x) => x.id === c.userId);
      const e = db.events.find((x) => x.id === c.eventId);
      rows.push([c.code, u?.name ?? "", e?.title ?? "", c.issuedAt.slice(0, 10)]);
    }
  } else if (type === "feedback") {
    rows = [["Training", "Employee", "Rating", "Comment", "Date"]];
    for (const f of db.feedback) {
      const e = db.events.find((x) => x.id === f.eventId);
      const u = db.users.find((x) => x.id === f.userId);
      rows.push([e?.title ?? "", u?.name ?? "", f.rating, f.comment, f.at.slice(0, 10)]);
    }
  }

  return new Response("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="novo-learning-hub-${name}-report.csv"`,
    },
  });
}
