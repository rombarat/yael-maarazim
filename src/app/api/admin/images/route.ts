import { NextResponse } from "next/server";
import { UnauthorizedError, requireAdmin } from "@/server/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, saveImage } from "@/server/images";

/** Upload a product photo (already resized in the browser). Returns { url }. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw e;
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  if (!IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "NOT_IMAGE" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
  const url = await saveImage(new Uint8Array(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url });
}
