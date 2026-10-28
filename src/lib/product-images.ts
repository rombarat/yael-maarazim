"use client";

const MAX_SIDE = 1600;

/** Resizes a phone photo (often 4–8MB, sometimes HEIC) to a web-friendly JPEG before upload. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

/** Uploads to /api/admin/images (stored in the database). Returns the image URL. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  if (file.size > 25 * 1024 * 1024) throw new Error("TOO_LARGE");
  const form = new FormData();
  form.append("file", new File([await compress(file)], "photo.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/admin/images", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "UPLOAD_FAILED");
  return (await res.json()).url as string;
}
