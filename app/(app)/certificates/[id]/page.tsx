import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import PrintButton from "@/components/print-button";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const db = await getDb();
  const cert = db.certificates.find((c) => c.id === id);
  if (!cert) notFound();
  if (user.role === "trainee" && cert.userId !== user.id) notFound();

  const holder = db.users.find((u) => u.id === cert.userId);
  const event = db.events.find((e) => e.id === cert.eventId);
  const trainer = db.users.find((u) => u.id === event?.trainerId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-5 flex items-center justify-between">
        <Link href="/certificates" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink3 transition hover:text-primary">
          <ArrowLeft size={15} /> Back to certificates
        </Link>
        <PrintButton />
      </div>

      <div className="card overflow-hidden bg-white !text-[#0a1633] dark:!border-line">
        <div className="h-2.5 bg-gradient-to-r from-navy via-[#0053b8] to-[#3b9bd8]" />
        <div className="px-8 py-12 text-center sm:px-14">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white">
            <GraduationCap size={28} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-[#43526d]">Novo Nordisk Learning Hub</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Certificate of Completion</h1>
          <p className="mt-8 text-sm text-[#43526d]">This certifies that</p>
          <p className="mt-2 text-2xl font-bold text-[#0a1633]">{holder?.name}</p>
          <p className="mt-1 text-sm text-[#43526d]">{holder?.title} · {holder?.department}</p>
          <p className="mt-6 text-sm text-[#43526d]">has successfully completed the training</p>
          <p className="mx-auto mt-2 max-w-lg text-xl font-bold leading-snug text-navy">{event?.title}</p>
          <p className="mt-6 text-sm text-[#43526d]">
            Delivered by <span className="font-semibold text-[#0a1633]">{trainer?.name}</span> on {event ? fmtDate(event.date) : "—"}
          </p>
          <div className="mx-auto mt-10 flex max-w-md items-end justify-between gap-8 border-t border-[#dde7f1] pt-6">
            <div className="text-left">
              <p className="font-mono text-[11px] text-[#8091ac]">{cert.code}</p>
              <p className="text-[11px] text-[#8091ac]">Verification code</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold italic text-navy">Sofia Lindqvist</p>
              <p className="text-[11px] text-[#8091ac]">Learning & Development, Novo Nordisk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
