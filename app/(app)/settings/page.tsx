import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import SettingsForm from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const db = await getDb();
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Admin settings</h1>
        <p className="mt-1 text-sm text-ink3">Configure trainers, departments, categories, working hours, branding and integrations.</p>
      </div>
      <SettingsForm settings={db.settings} />
    </div>
  );
}
