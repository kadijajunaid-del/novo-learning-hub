import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Clock, Download, FileText, Globe2, Info, ListChecks,
  MapPin, Star, Users, Video, Repeat, Eye, BellRing, UserRound,
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
import SessionStatus from "@/components/session-status";
import AddSession from "@/components/add-session";
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
  const isAssignedTrainer = user.role === "trainer" && (event.assignedTrainerIds ?? []).includes(user.id);
  const canManage = user.role === "admin" || (user.role === "trainer" && event.trainerId === user.id);
  // Owner, admin, or an assigned trainer (when the event allows it) may add sessions.
  const canAddSession =
    (canManage || (isAssignedTrainer && event.allowTrainerSessions)) &&
    event.status !== "cancelled" &&
    (user.role === "admin" || db.settings.trainersCanManageSessions !== false);
  const st = statusTone(event.status, event.date);
  const rating = eventRating(db, event.id);
  const myFeedback = db.feedback.find((f) => f.eventId === event.id && f.userId === user.id);
  const attendanceRows = regs.map((r) => {
    const u = db.users.find((x) => x.id === r.userId);
    return { userId: r.userId, name: u?.name ?? "Unknown", department: u?.department ?? "", attended: r.attended };
  });
  // Trainers see only the sessions assigned to them; everyone else sees all.
  const allSessions = eventSessions(event);
  const sessions = user.role === "trainer" ? allSessions.filter((s) => s.trainerId === user.id) : allSessions;
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
              <Fact icon={<CalendarDays size={16} />} label="Starts" value={sessions.length ? fmtDate(sessions[0].date) : "—"} />
              <Fact icon={<ListChecks size={16} />} label={user.role === "trainer" ? "My sessions" : "Sessions"} value={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`} />
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
                          {s.completed && <Badge tone="green">Completed</Badge>}
                          {!s.completed && isPast && event.status !== "cancelled" && <Badge tone="gray">Past</Badge>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink2">
                          <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-ink3" /> {fmtDate(s.date)}</span>
                          <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-ink3" /> {fmtTime(s.startTime)} – {fmtTime(s.endTime)}</span>
                          <span className="inline-flex items-center gap-1.5">
                            {s.platform === "Physical Meeting" ? <MapPin size={12} className="text-serious" /> : <Video size={12} className="text-primary" />}
                            {s.platform === "Physical Meeting" ? s.venue : s.platform}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-ink3">
                            <UserRound size={12} /> {db.users.find((u) => u.id === s.trainerId)?.name ?? trainer?.name ?? "—"}
                          </span>
                          {s.category && (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-strong dark:text-primary">
                              {s.category}
                            </span>
                          )}
                        </div>
                        {/* delivery status */}
                        {event.status !== "cancelled" && (user.role === "trainer" || canManage) && (
                          <div className="mt-2">
                            {user.role === "trainer" && s.trainerId === user.id ? (
                              <SessionStatus eventId={event.id} sessionId={s.id} accepted={!!s.accepted} completed={!!s.completed} mode="trainer" />
                            ) : (
                              <SessionStatus eventId={event.id} sessionId={s.id} accepted={!!s.accepted} completed={!!s.completed} mode="view" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {s.meetingLink && (registered || canManage || isAssignedTrainer) && (
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
                          >
                            <Video size={13} /> Join
                          </a>
                        )}
                        {(registered || canManage || isAssignedTrainer) && event.status === "published" && (
                          <SessionIcs eventId={event.id} sessionId={s.id} />
                        )}
                      </div>
                    </li>
                  );
                })}
                {!sessions.length && (
                  <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink3">
                    No sessions scheduled yet.{canAddSession ? " Use “Add session” to schedule one." : ""}
                  </li>
                )}
              </ol>
              {canAddSession && (
                <div className="mt-3">
                  <AddSession
                    eventId={event.id}
                    platforms={db.settings.platforms}
                    categories={db.settings.categories}
                    defaultCategory={event.category}
                    nextIndex={sessions.length + 1}
                    trainers={user.role === "admin" ? db.users.filter((u) => u.role === "trainer" && u.active).map((t) => ({ id: t.id, name: t.name })) : undefined}
                  />
                </div>
              )}
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
              {canManage && <EventActions eventId={event.id} status={event.status} isAdmin={user.role === "admin"} />}
            </section>
          </div>

          {/* sidebar */}
          <aside className="space-y-5">
            {(() => {
              // Distinct trainers across all sessions, each with their session
              // count and combined delivery status.
              const ids = [...new Set(allSessions.map((s) => s.trainerId).filter(Boolean))];
              if (!ids.length) return null;
              return (
                <Card className="p-5">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink3">
                    Trainer{ids.length === 1 ? "" : "s"} ({ids.length})
                  </div>
                  <ul className="space-y-3">
                    {ids.map((tid) => {
                      const tu = db.users.find((u) => u.id === tid);
                      if (!tu) return null;
                      const mySessions = allSessions.filter((s) => s.trainerId === tid);
                      const done = mySessions.filter((s) => s.completed).length;
                      const accepted = mySessions.filter((s) => s.accepted).length;
                      const statusTxt = done === mySessions.length ? "All delivered" : accepted ? `${accepted}/${mySessions.length} accepted` : "Not yet accepted";
                      const statusTone = done === mySessions.length ? "green" : accepted ? "blue" : "gray";
                      return (
                        <li key={tid} className="flex items-start gap-3">
                          <Avatar name={tu.name} size={38} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-ink">{tu.name}</div>
                            <div className="truncate text-xs text-ink3">{tu.title} · {tu.department}</div>
                            <a href={`mailto:${tu.email}`} className="block truncate text-xs font-medium text-primary hover:underline">{tu.email}</a>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-ink2">{mySessions.length} session{mySessions.length === 1 ? "" : "s"}</span>
                              {(user.role === "admin" || (user.role === "trainer" && event.trainerId === user.id)) && (
                                <Badge tone={statusTone}>{statusTxt}</Badge>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })()}

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
