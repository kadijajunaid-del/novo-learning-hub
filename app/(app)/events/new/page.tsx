import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import EventForm from "@/components/event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user || user.role === "trainee") redirect("/dashboard");
  const db = await getDb();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Create training event</h1>
        <p className="mt-1 text-sm text-ink3">Publish to make it instantly visible to all trainees, or save as a draft.</p>
      </div>
      <EventForm
        categories={db.settings.categories}
        platforms={db.settings.platforms}
        reminderOptions={db.settings.reminderOptions}
        batches={db.settings.batches}
        departments={db.settings.departments}
        trainerName={user.name}
        trainers={user.role === "admin" ? db.users.filter((u) => u.role === "trainer" && u.active).map((t) => ({ id: t.id, name: t.name })) : undefined}
      />
    </div>
  );
}
