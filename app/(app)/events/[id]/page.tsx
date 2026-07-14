import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, CalendarDays, CalendarPlus, Clock, Download, FileText, Globe2, Info, ListChecks,
  MapPin, Star, Users, Video, Repeat, Eye, BellRing,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, Badge, Avatar, SectionHeader, statusTone } from "@/components/ui";
import NotifyMe from "@/components/notify-me";
import EventActions from "@/components/event-actions";
import AttendancePanel from "@/components/attendance-panel";
import FeedbackForm from "@/components/feedback-form";
import { regsFor, eventRating, eventSessions, visibleToTrainee } from "@/lib/queries";
import SessionIcs from "@/components/session-ics";
import { fmtDate, fmtTime, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) notFound();
  if (user.role === "trainee" && event.status === "draft") notFound();
  if (user.role === "trainee" && !visibleToTrainee(event, user) && !db.registrations.some((r) => r.eventId === event.id && r.userId === user.id)) notFound();

  const trainer = db.users.find((u) => u.id === event.trainerId);
  const regs = regsFor(db, event.id);
  const registered = regs.some((r) => r.userId === user.id);
  const canManage = user.role === "admin" || (user.role === "trainer" && event.trainerId === user.id);
  const st = statusTone(event.status, event.date);
  const rating = eventRating(db, event.id);
  const myFeedback = db.feedback.find((f) => f.eventId === event.id && f.userId === user.id);
  const attendanceRows = regs.map((r) => {
    const u = db.users.find((x) => x.id === r.userId);
    return { userId: r.userId, name: u?.name ?? "Unknown", department: u?.department ?? "", attended: r.attended };
  });
  const sessions = eventSessions(event);
  const today = todayISO();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink3 transition hover:text-primary">
        <ArrowLeft size={15} /> Back to events
      </Link>

      <div className="card overflow-hidden">
        {/* hero strip */}
        <div className="bg-gradient-to-r from-navy to-[#0053b8] px-6 py-7 dark:from-[#0a1c4d] dark:to-[#0d3a7e] sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">{event.category}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
            {event.repeat !== "None" && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur"><Repeat size={11} /> {event.repeat}</span>}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">{event.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-blue-100">{event.description}</p>
          {rating && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Star size={13} className="fill-[var(--warn)] text-[var(--warn)]" /> {rating.toFixed(1)} / 5 participant rating
            </div>
          )}
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          <div className="space-y-7 lg:col-span-2">
            {/* key facts */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Fact icon={<CalendarDays size={16} />} label="Starts" value={fmtDate(sessions[0].date)} />
              <Fact icon={<ListChecks size={16} />} label="Sessions" value={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`} />
              <Fact icon={<Globe2 size={16} />} label="Time zone" value={event.timeZone} />
              <Fact icon={<Users size={16} />} label="Seats" value={`${regs.length} / ${event.maxParticipants}`} />
              <Fact icon={<BellRing size={16} />} label="Reminder" value={`${event.reminder} before each session`} />
              <Fact icon={<Eye size={16} />} label="Visibility" value={event.visibility} />
              {(event.validFrom || event.validUntil) && (
                <Fact
                  icon={<ListChecks size={16} />}
                  label="Registration window"
                  value={`${event.validFrom ? fmtDate(event.validFrom) : "Open"} → ${event.validUntil ? fmtDate(event.validUntil) : "no end date"}`}
                />
              )}
            </div>

            {/* sessions */}
            <section>
              <SectionHeader title="Sessions" sub="One registration covers the whole programme — every session lands in your Outlook calendar." />
              <ol className="space-y-2.5">
                {sessions.map((s, i) => {
                  const isPast = s.date < today;
                  const isToday = s.date === today;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line p-4">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${isPast ? "bg-surface2 text-ink3" : "bg-primary-soft text-primary"}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                          {s.name || `Session ${i + 1}`}
                          {isToday && <Badge tone="blue">Today</Badge>}
                          {isPast && event.status !== "cancelled" && <Badge tone="green">Done</Badge>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink2">
                          <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-ink3" /> {fmtDate(s.date)}</span>
                          <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-ink3" /> {fmtTime(s.startTime)} – {fmtTime(s.endTime)}</span>
                          <span className="inline-flex items-center gap-1.5">
                            {s.platform === "Physical Meeting" ? <MapPin size={12} className="text-serious" /> : <Video size={12} className="text-primary" />}
                            {s.platform === "Physical Meeting" ? s.venue : s.platform}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-ink3">
                            {db.users.find((u) => u.id === s.trainerId)?.name ?? trainer?.name ?? "—"}
                          </span>
                          {s.category && (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-strong dark:text-primary">
                              {s.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.meetingLink && (registered || canManage) && (
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
                          >
                            <Video size={13} /> Join
                          </a>
                        )}
                        {(registered || canManage) && event.status === "published" && (
                          <SessionIcs eventId={event.id} sessionId={s.id} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {event.agenda.length > 0 && (
              <section>
                <SectionHeader title="Agenda" />
                <ol className="space-y-2">
                  {event.agenda.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-surface2 px-4 py-2.5 text-sm text-ink">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {(event.prerequisites && event.prerequisites !== "None") || event.instructions ? (
              <section className="grid gap-3 sm:grid-cols-2">
                {event.prerequisites && event.prerequisites !== "None" && (
                  <div className="rounded-xl border border-warn/40 bg-warn/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink2"><ListChecks size={14} /> Prerequisites</div>
                    <p className="text-sm leading-relaxed text-ink2">{event.prerequisites}</p>
                  </div>
                )}
                {event.instructions && (
                  <div className="rounded-xl border border-line bg-surface2 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink2"><Info size={14} /> Meeting instructions</div>
                    <p className="text-sm leading-relaxed text-ink2">{event.instructions}</p>
                  </div>
                )}
              </section>
            ) : null}

            {event.materials.length > 0 && (
              <section>
                <SectionHeader title="Training materials" sub="Available to registered participants" />
                <ul className="grid gap-2 sm:grid-cols-2">
                  {event.materials.map((m) => (
                    <li key={m.name}>
                      <a
                        href={`/api/materials?name=${encodeURIComponent(m.name)}`}
                        className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition hover:border-primary hover:bg-primary-soft/40"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><FileText size={16} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                          <span className="text-xs text-ink3">{m.size}</span>
                        </span>
                        <Download size={15} className="text-ink3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* actions */}
            <section className="border-t border-line pt-6">
              {user.role === "trainee" && event.status === "published" && (
                (!event.validFrom || today >= event.validFrom) && (!event.validUntil || today <= event.validUntil) ? (
                  <NotifyMe eventId={event.id} platform={event.platform} registered={registered} full={regs.length >= event.maxParticipants} />
                ) : registered ? (
                  <NotifyMe eventId={event.id} platform={event.platform} registered={registered} full={regs.length >= event.maxParticipants} />
                ) : (
                  <p className="rounded-xl bg-surface2 px-4 py-3 text-sm font-medium text-ink2">
                    {event.validFrom && today < event.validFrom
                      ? `Registration opens on ${fmtDate(event.validFrom)}.`
                      : "Registration for this training has closed."}
                  </p>
                )
              )}
              {user.role === "trainee" && event.status === "completed" && registered && (
                <div>
                  <SectionHeader title="Rate this training" sub="Your feedback helps us improve — it also rates the trainer." />
                  <FeedbackForm eventId={event.id} existing={myFeedback ? { rating: myFeedback.rating, comment: myFeedback.comment } : undefined} />
                </div>
              )}
              {user.role === "trainee" && event.status === "cancelled" && (
                <p className="rounded-xl bg-crit/10 px-4 py-3 text-sm font-medium text-crit">This event was cancelled. Registered participants have been notified.</p>
              )}
              {canManage && (
                <div className="space-y-3">
                  <EventActions eventId={event.id} status={event.status} />
                  {event.status === "published" && (
                    <a
                      href={`/api/events/${event.id}/ics`}
                      className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2"
                    >
                      <CalendarPlus size={15} /> Add to Outlook Calendar (.ics)
                    </a>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* sidebar */}
          <aside className="space-y-5">
            {trainer && (
              <Card className="p-5">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink3">Trainer</div>
                <div className="flex items-center gap-3">
                  <Avatar name={trainer.name} size={46} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">{trainer.name}</div>
                    <div className="truncate text-xs text-ink3">{trainer.title}</div>
                    <div className="truncate text-xs text-ink3">{trainer.department}</div>
                  </div>
                </div>
                <a href={`mailto:${trainer.email}`} className="mt-3 block truncate text-xs font-medium text-primary hover:underline">{trainer.email}</a>
              </Card>
            )}

            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink3">Participants</span>
                <span className="text-xs font-semibold text-ink2">{regs.length}/{event.maxParticipants}</span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (regs.length / event.maxParticipants) * 100)}%` }} />
              </div>
              {canManage ? (
                <AttendancePanel eventId={event.id} rows={attendanceRows} />
              ) : (
                <ul className="space-y-2">
                  {attendanceRows.slice(0, 6).map((r) => (
                    <li key={r.userId} className="flex items-center gap-2.5">
                      <Avatar name={r.name} size={26} />
                      <span className="truncate text-sm text-ink2">{r.name}</span>
                    </li>
                  ))}
                  {regs.length > 6 && <li className="text-xs text-ink3">+{regs.length - 6} more</li>}
                  {!regs.length && <li className="text-xs text-ink3">Be the first to register.</li>}
                </ul>
              )}
              {canManage && attendanceRows.length > 0 && (
                <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink3">
                  ✓ / ✗ marks attendance. QR check-in is available on-site.
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-ink3">{label}</span>
        <span className="block text-[13px] font-semibold leading-snug text-ink">{value}</span>
      </span>
    </div>
  );
}
