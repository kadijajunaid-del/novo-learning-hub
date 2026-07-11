import Link from "next/link";
import { Award, Download } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();
  const certs = user.role === "trainee"
    ? db.certificates.filter((c) => c.userId === user.id)
    : db.certificates;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">My certificates</h1>
        <p className="mt-1 text-sm text-ink3">Issued automatically when you attend a completed training.</p>
      </div>
      {certs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => {
            const event = db.events.find((e) => e.id === c.eventId);
            const holder = db.users.find((u) => u.id === c.userId);
            return (
              <Card key={c.id} className="card-hover fade-up p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a227] to-[#8a6d1a] text-white">
                  <Award size={20} />
                </span>
                <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink">{event?.title}</h3>
                {user.role !== "trainee" && <p className="mt-1 text-xs text-ink2">{holder?.name}</p>}
                <p className="mt-1 text-xs text-ink3">Issued {fmtDate(c.issuedAt.slice(0, 10))}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink3">{c.code}</p>
                <Link
                  href={`/certificates/${c.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
                >
                  <Download size={13} /> View & download
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Award size={22} />}
          title="No certificates yet"
          sub="Attend a training to completion and your certificate will be issued here automatically."
        />
      )}
    </div>
  );
}
