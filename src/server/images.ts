import "server-only";
import { query, queryOne } from "./db";

export const IMAGE_PREFIX = "/api/images/";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function saveImage(bytes: Uint8Array, contentType: string) {
  const row = await queryOne<{ id: string }>(
    "insert into images (content_type, data) values ($1, decode($2, 'base64')) returning id::text",
    [contentType, Buffer.from(bytes).toString("base64")],
  );
  return `${IMAGE_PREFIX}${row!.id}`;
}

export async function loadImage(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = await queryOne<{ content_type: string; b64: string }>(
    "select content_type, encode(data, 'base64') as b64 from images where id = $1",
    [id],
  );
  return row ? { contentType: row.content_type, bytes: Buffer.from(row.b64, "base64") } : null;
}

/** Removes a stored image once no product or category points at it. Static /public paths are ignored. */
export async function deleteImageIfUnused(url: string) {
  if (!url.startsWith(IMAGE_PREFIX)) return;
  const id = url.slice(IMAGE_PREFIX.length);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await query(
    `delete from images where id = $1
       and not exists (select 1 from products where image_url = $2)
       and not exists (select 1 from categories where image_url = $2)`,
    [id, url],
  );
}
