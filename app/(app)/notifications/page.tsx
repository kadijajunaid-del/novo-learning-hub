import { Bell, BellRing, CalendarClock, ClipboardCheck, Megaphone } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, EmptyState, Badge } from "@/components/ui";
import AnnounceForm from "@/components/announce-form";
import MarkRead from "@/components/mark-read";
import { notificationsFor, unreadCount } from "@/lib/queries";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, React.ReactNode> = {
  announcement: <Megaphone size={15} />,
  reminder: <CalendarClock size={15} />,
  registration: <ClipboardCheck size={15} />,
  event: <BellRing size={15} />,
  system: <Bell size={15} />,
};

export default async function NotificationsPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();
  const items = notificationsFor(db, user);
  const unread = unreadCount(db, user);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">Notification centre</h1>
          <p className="mt-1 text-sm text-ink3">In-app, email, push and Outlook calendar reminders in one place.</p>
        </div>
        <MarkRead unread={unread} />
      </div>

      <div className="space-y-6">
        {user.role === "admin" && <AnnounceForm />}

        <Card className="divide-y divide-line/70">
          {items.map((n) => {
            const isUnread = !n.readBy.includes(user.id);
            return (
              <div key={n.id} className={`flex gap-4 p-5 ${isUnread ? "bg-primary-soft/40" : ""}`}>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isUnread ? "bg-primary text-white" : "bg-surface2 text-ink2"}`}>
                  {KIND_ICON[n.kind] ?? KIND_ICON.system}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{n.title}</span>
                    {isUnread && <Badge tone="blue">New</Badge>}
                    <span className="ml-auto text-xs text-ink3">{relTime(n.at)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink2">{n.body}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-ink3">
                    {n.kind} · to {n.to === "all" ? "everyone" : n.to === "trainers" ? "trainers" : n.to === "trainees" ? "trainees" : "you"}
                  </p>
                </div>
              </div>
            );
          })}
          {!items.length && (
            <div className="p-8">
              <EmptyState icon={<Bell size={22} />} title="No notifications" sub="Announcements, reminders and registration confirmations will appear here." />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
