import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import TrainerManager, { type TrainerRow } from "@/components/trainer-manager";
import { trainerRating } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const db = await getDb();

  const rows: TrainerRow[] = db.users
    .filter((u) => u.role === "trainer")
    .map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      department: t.department,
      title: t.title,
      active: t.active,
      sessions: db.events.filter((e) => e.trainerId === t.id && e.status !== "draft" && e.status !== "cancelled").length,
      rating: trainerRating(db, t.id)?.toFixed(1) ?? "—",
    }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Trainers</h1>
        <p className="mt-1 text-sm text-ink3">Create, edit, disable trainer accounts and reset passwords.</p>
      </div>
      <TrainerManager trainers={rows} departments={db.settings.departments} maxTrainers={db.settings.maxTrainers} />
    </div>
  );
}
