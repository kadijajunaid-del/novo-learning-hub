import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import EventForm from "@/components/event-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) notFound();
  const canEdit = user.role === "admin" || (user.role === "trainer" && event.trainerId === user.id);
  if (!canEdit) redirect(`/events/${id}`);
  const trainer = db.users.find((u) => u.id === event.trainerId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Edit event</h1>
        <p className="mt-1 text-sm text-ink3">{event.title}</p>
      </div>
      <EventForm
        categories={db.settings.categories}
        platforms={db.settings.platforms}
        reminderOptions={db.settings.reminderOptions}
        batches={db.settings.batches}
        departments={db.settings.departments}
        trainerName={trainer?.name ?? user.name}
        trainers={user.role === "admin" ? db.users.filter((u) => u.role === "trainer" && u.active).map((t) => ({ id: t.id, name: t.name })) : undefined}
        allTrainees={db.users.filter((u) => u.role === "trainee" && u.active).map((t) => ({ id: t.id, name: t.name, batch: t.batch ?? "" }))}
        existing={event}
      />
    </div>
  );
}
