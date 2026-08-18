import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { unreadCount } from "@/lib/queries";
import Shell from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Force a password change on first login (or after an admin reset).
  if (user.mustChangePassword) redirect("/account");
  const db = await getDb();
  return (
    <Shell
      user={{ id: user.id, name: user.name, role: user.role, title: user.title }}
      unread={unreadCount(db, user)}
    >
      {children}
    </Shell>
  );
}
