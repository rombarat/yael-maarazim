import { loadImage } from "@/server/images";

/** Serves product photos stored in the database. Ids are unique per upload, so cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const image = await loadImage((await params).id);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
