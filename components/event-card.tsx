import Link from "next/link";
import { CalendarDays, Clock, MapPin, Video, Users } from "lucide-react";
import type { TrainingEvent, User } from "@/lib/types";
import { Badge, Avatar, statusTone } from "./ui";
import { fmtDate, fmtTime } from "@/lib/format";

export function PlatformChip({ platform }: { platform: string }) {
  const physical = platform === "Physical Meeting";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink2">
      {physical ? <MapPin size={13} className="text-serious" /> : <Video size={13} className="text-primary" />}
      {physical ? "In person" : platform}
    </span>
  );
}

export function EventCard({
  event,
  trainer,
  registered,
  seatsTaken,
}: {
  event: TrainingEvent;
  trainer?: User;
  registered?: boolean;
  seatsTaken?: number;
}) {
  const st = statusTone(event.status, event.date);
  const nSessions = event.sessions?.length || 1;
  return (
    <Link
      href={`/events/${event.id}`}
      className="card card-hover fade-up block p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone="navy">{event.category}</Badge>
        <span className="flex items-center gap-2">
          {registered && <Badge tone="green">Registered</Badge>}
          <Badge tone={st.tone}>{st.label}</Badge>
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink">{event.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink3">{event.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink2">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-ink3" />{nSessions > 1 ? "Starts " : ""}{fmtDate(event.date)}</span>
        <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-ink3" />{fmtTime(event.startTime)} – {fmtTime(event.endTime)}</span>
        {nSessions > 1 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary-strong dark:text-primary">
            {nSessions} sessions
          </span>
        ) : (
          <PlatformChip platform={event.platform} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        {trainer ? (
          <span className="flex items-center gap-2">
            <Avatar name={trainer.name} size={26} />
            <span className="text-xs font-medium text-ink2">{trainer.name}</span>
          </span>
        ) : <span />}
        {typeof seatsTaken === "number" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink3">
            <Users size={13} /> {seatsTaken}/{event.maxParticipants}
          </span>
        )}
      </div>
    </Link>
  );
}
