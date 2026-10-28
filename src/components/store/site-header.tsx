"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import clsx from "clsx";
import { cartTotals, useCart, useCartHydrated } from "@/lib/cart-store";
import { brand } from "@/config/brand";
import { BrandMark } from "@/components/ui/brand-mark";

const NAV = [
  { href: "/shop", label: "החנות" },
  ...(brand.story ? [{ href: "/#story", label: brand.story.title }] : []),
  { href: "/#how", label: "איך מזמינים" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const bumpKey = useCart((s) => s.bumpKey);
  const openDrawer = useCart((s) => s.openDrawer);
  const hydrated = useCartHydrated();
  const { count } = cartTotals(lines);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:h-[72px] md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${brand.name}, לדף הבית`}>
          <BrandMark priority className="h-11 w-auto md:h-12" textClassName="text-[26px] md:text-[30px]" />
        </Link>

        <nav aria-label="ניווט ראשי" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 text-[16px] font-medium transition-colors hover:bg-surface",
                    pathname === item.href ? "text-brand" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="rounded-full px-3 py-2 text-[16px] font-medium text-ink hover:bg-surface md:hidden"
          >
            החנות
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative flex size-11 items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-brand/40"
            aria-label={hydrated && count > 0 ? `סל הקניות, ${count} פריטים` : "סל הקניות"}
          >
            <ShoppingBag className="size-5" strokeWidth={1.75} />
            {hydrated && count > 0 && (
              <span
                key={bumpKey}
                className="animate-bump tabular absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1 text-[12px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
