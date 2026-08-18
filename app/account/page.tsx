import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ChangePassword from "@/components/change-password";
import { TopMark } from "@/components/logo";

export const dynamic = "force-dynamic";

// Standalone (outside the app shell) so the forced-change redirect can't loop.
export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const forced = !!user.mustChangePassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-[#00247e] to-[#0053b8] p-4 dark:from-[#040a1c] dark:via-[#081538] dark:to-[#0a2050]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <TopMark size={40} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">Change password</h1>
            <p className="text-sm text-blue-200">{user.name}</p>
          </div>
        </div>
        <div className="card p-7">
          <ChangePassword forced={forced} />
        </div>
      </div>
    </div>
  );
}
