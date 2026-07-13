import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildIcs } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const db = await getDb();
  const event = db.events.find((e) => e.id === id);
  if (!event) return new Response("Not found", { status: 404 });

  const trainer = db.users.find((u) => u.id === event.trainerId);
  const ics = buildIcs(event, trainer, user, db.users);
  const slug = event.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
