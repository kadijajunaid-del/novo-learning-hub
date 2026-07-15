import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import TeamLeaderManager, { type LeaderRow } from "@/components/team-leader-manager";
import { teamLeaderBatches, teamLeaderTrainees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TeamLeadersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const db = await getDb();

  const rows: LeaderRow[] = db.users
    .filter((u) => u.role === "team_leader")
    .map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      department: l.department,
      title: l.title,
      active: l.active,
      batches: teamLeaderBatches(db, l.id),
      traineeCount: teamLeaderTrainees(db, l.id).length,
    }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Team Leaders</h1>
        <p className="mt-1 text-sm text-ink3">Create team leaders and assign trainee batches. Each leader sees a dashboard for the trainees in their batches.</p>
      </div>
      <TeamLeaderManager
        leaders={rows}
        departments={db.settings.departments}
        batches={db.settings.batches}
        batchOwner={db.settings.batchLeaders ?? {}}
      />
    </div>
  );
}
