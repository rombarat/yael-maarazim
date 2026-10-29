"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartTotals, useCart, useCartHydrated } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/brand";
import { useLang, useT } from "@/i18n/client";
import { LanguageSwitch } from "./language-switch";

/** Logo badge next to the name, and the cart. The whole store is one page, so there is no menu. */
export function SiteHeader() {
  const lines = useCart((s) => s.lines);
  const bumpKey = useCart((s) => s.bumpKey);
  const openDrawer = useCart((s) => s.openDrawer);
  const hydrated = useCartHydrated();
  const { count, total } = cartTotals(lines);
  const lang = useLang();
  const t = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-2 px-4 md:h-20 md:gap-3 md:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-3" aria-label={t.header.home}>
          <Image
            src={brand.badge.src}
            alt=""
            width={brand.badge.width}
            height={brand.badge.height}
            priority
            sizes="64px"
            className="h-12 w-auto shrink-0 md:h-16"
          />
          <span className="line-clamp-2 font-display text-[20px] font-semibold leading-[1.1] text-brand ltr:text-[18px] md:text-[30px] md:leading-none ltr:md:text-[30px]">{t.brandName}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitch />
          <button
            type="button"
            onClick={openDrawer}
            className="relative flex h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 transition-colors hover:border-brand/40 md:px-4"
            aria-label={hydrated && count > 0 ? t.header.cartWithCount(count) : t.header.cart}
          >
            <ShoppingBag className="size-5" strokeWidth={1.75} />
            {hydrated && count > 0 && (
              <>
                <span className="tabular hidden font-semibold md:inline" aria-hidden="true">
                  {formatPrice(total, lang)}
                </span>
                <span
                  key={bumpKey}
                  className="animate-bump tabular absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1 text-[12px] font-bold text-white"
                >
                  {count}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
