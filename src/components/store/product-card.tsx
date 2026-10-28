"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/ui/social-icons";
import { useCart } from "@/lib/cart-store";
import { useProductDialog } from "@/lib/product-dialog";
import { whatsappMessageHref } from "@/lib/contact";
import { useLang, useT } from "@/i18n/client";
import { STORE_TOASTER } from "./store-toaster";
import { productPriceLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  /** Ordered by WhatsApp instead of the cart (workshops, price on request). */
  contactOnly?: boolean;
  phone?: string;
  priority?: boolean;
};

export function ProductCard({ product, contactOnly = false, phone = "", priority = false }: Props) {
  const openDialog = useProductDialog((s) => s.open);
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const lang = useLang();
  const t = useT();
  const needsChoice = product.variants.length > 0;
  const soldOut = !product.is_available;
  const showPrice = !contactOnly || Number(product.price) > 0;

  const quickAdd = () => {
    if (needsChoice) {
      openDialog(product.id);
      return;
    }
    add({ product, quantity: 1 });
    toast.success(t.product.added(product.name), { toasterId: STORE_TOASTER, action: { label: t.product.toCart, onClick: openDrawer } });
  };

  return (
    <article className="group flex flex-col">
      {/* The photo and the name open the details; the link keeps working in a new tab. */}
      <a
        href={`/?product=${product.id}`}
        onClick={(e) => {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          openDialog(product.id);
        }}
        className="flex flex-1 flex-col rounded-[var(--radius-photo)]"
      >
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-photo)] bg-surface">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw"
              className={
                soldOut
                  ? "object-cover opacity-55 grayscale-[60%]"
                  : "object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              }
            />
          )}
          {soldOut && (
            <span className="absolute start-2.5 top-2.5 rounded-full bg-white px-3 py-1 text-[14px] font-semibold">{t.product.soldOut}</span>
          )}
        </div>
        <h3 className="mt-3 font-display text-[18px] font-medium leading-snug md:text-[19px]">{product.name}</h3>
        {product.unit_label && <p className="mt-0.5 text-[15px] leading-snug text-muted">{product.unit_label}</p>}
        {product.tags.length > 0 && <p className="mt-0.5 text-[14px] font-semibold text-success">{product.tags.join(", ")}</p>}
      </a>

      {contactOnly ? (
        <div className="mt-2">
          {showPrice && <p className="tabular mb-2 font-display text-[19px] font-semibold">{productPriceLabel(product, lang)}</p>}
          {phone && (
            <a
              href={whatsappMessageHref(phone, t.whatsapp.inquiry(product.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-3 text-[16px] font-semibold text-ink transition-colors hover:border-[#25D366] hover:bg-[#25D366]/10"
              aria-label={t.whatsapp.arrangeAria(product.name)}
            >
              <WhatsAppIcon className="size-5 shrink-0" />
              {t.whatsapp.arrange}
            </a>
          )}
        </div>
      ) : (
        <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
          <span className="tabular font-display text-[19px] font-semibold">{productPriceLabel(product, lang)}</span>
          {!soldOut && (
            <button
              type="button"
              onClick={quickAdd}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark active:scale-[0.96]"
              aria-label={needsChoice ? t.product.chooseAria(product.name) : t.product.addAria(product.name)}
            >
              <Plus className="size-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
