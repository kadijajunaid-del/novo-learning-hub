import { getSessionUser } from "@/lib/auth";

// Demo file store: serves a placeholder for seeded training materials.
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Not signed in", { status: 401 });
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "material.txt";
  const body = `CDC Türkiye TOP Portal — Training Material\n\nFile: ${name}\n\nThis is a placeholder file served by the demo environment.\nIn production, materials are stored in secure blob storage (e.g. Azure Blob / SharePoint)\nand streamed here with access control.\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name.replace(/[^\w.\- ]/g, "_")}.txt"`,
    },
  });
}
