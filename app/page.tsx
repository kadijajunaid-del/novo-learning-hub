import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The login screen is the entry point — no public landing page.
export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/login");
}
