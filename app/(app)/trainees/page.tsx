import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, Avatar, Badge } from "@/components/ui";
import DeleteUser from "@/components/delete-user";
import { fmtDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TraineesPage() {
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();

  // Trainers see the people registered for their sessions; admin sees everyone.
  const myEventIds = user.role === "trainer" ? db.events.filter((e) => e.trainerId === user.id).map((e) => e.id) : null;
  const trainees = db.users.filter((u) => {
    if (u.role !== "trainee") return false;
    if (!myEventIds) return true;
    return db.registrations.some((r) => r.userId === u.id && myEventIds.includes(r.eventId));
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">
          {user.role === "trainer" ? "My trainees" : "Trainees"}
        </h1>
        <p className="mt-1 text-sm text-ink3">
          {trainees.length} new hire{trainees.length === 1 ? "" : "s"} onboarding — click a person for their full training history.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink3">
              <th className="px-5 py-3.5 font-semibold">Employee</th>
              <th className="px-5 py-3.5 font-semibold">Department</th>
              <th className="px-5 py-3.5 font-semibold">Joined</th>
              <th className="px-5 py-3.5 font-semibold">Registered</th>
              <th className="px-5 py-3.5 font-semibold">Attended</th>
              <th className="px-5 py-3.5 font-semibold">Missed</th>
              <th className="px-5 py-3.5 font-semibold">Certificates</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map((t) => {
              const regs = db.registrations.filter((r) => r.userId === t.id && (!myEventIds || myEventIds.includes(r.eventId)));
              const attended = regs.filter((r) => r.attended === true).length;
              const missed = regs.filter((r) => r.attended === false).length;
              const certs = db.certificates.filter((c) => c.userId === t.id).length;
              return (
                <tr key={t.id} className="border-b border-line/60 transition last:border-0 hover:bg-surface2/50">
                  <td className="px-5 py-3.5">
                    <Link href={`/trainees/${t.id}`} className="group flex items-center gap-3">
                      <Avatar name={t.name} size={34} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink group-hover:text-primary">{t.name}</div>
                        <div className="truncate text-xs text-ink3">{t.title} · {t.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink2">{t.department}</td>
                  <td className="px-5 py-3.5 text-ink2">{fmtDateShort(t.joined)}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink">{regs.length}</td>
                  <td className="px-5 py-3.5 text-ok">{attended}</td>
                  <td className="px-5 py-3.5 text-crit">{missed}</td>
                  <td className="px-5 py-3.5 text-ink2">{certs}</td>
                  <td className="px-5 py-3.5">{t.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/trainees/${t.id}`}
                        aria-label={`View ${t.name}`}
                        title={`View ${t.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink2 transition hover:bg-surface2"
                      >
                        <ChevronRight size={15} />
                      </Link>
                      {user.role === "admin" && (
                        <DeleteUser
                          endpoint={`/api/trainees/${t.id}`}
                          name={t.name}
                          warning="This permanently removes the account together with all registrations, certificates and feedback. This cannot be undone."
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!trainees.length && (
              <tr><td colSpan={9} className="px-5 py-8 text-center text-xs text-ink3">No trainees yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
