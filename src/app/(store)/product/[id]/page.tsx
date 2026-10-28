import { redirect } from "next/navigation";

/** Product details open over the store page; old /product/<id> links open the same details there. */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(/^[0-9a-f-]{36}$/i.test(id) ? `/?product=${id}` : "/");
}
