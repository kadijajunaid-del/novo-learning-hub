import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import BatchManager, { type BatchRow } from "@/components/batch-manager";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const db = await getDb();

  const person = (u: any) => ({ id: u.id, name: u.name, email: u.email, department: u.department });

  const rows: BatchRow[] = db.settings.batches.map((name) => ({
    name,
    leaderId: db.settings.batchLeaders?.[name] ?? "",
    trainees: db.users.filter((u) => u.role === "trainee" && u.batch === name).map(person),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Batches</h1>
        <p className="mt-1 text-sm text-ink3">Create trainee batches, assign a team leader to each, and add trainees.</p>
      </div>
      <BatchManager
        batches={rows}
        leaders={db.users.filter((u) => u.role === "team_leader" && u.active).map((l) => ({ id: l.id, name: l.name }))}
        allTrainees={db.users.filter((u) => u.role === "trainee").map(person)}
      />
    </div>
  );
}
