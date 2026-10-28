import { redirect } from "next/navigation";

/** The store is one page now; old links to /shop (and /shop?category=<id>) land on it. */
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  redirect(category && /^[0-9a-f-]{36}$/i.test(category) ? `/#cat-${category}` : "/");
}
