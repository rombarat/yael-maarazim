"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Clock, MessageCircle, Phone, ShoppingBag, X } from "lucide-react";
import { useModal } from "@/components/ui/use-modal";
import { productIdFromUrl, syncProductDialogFromUrl, useProductDialog } from "@/lib/product-dialog";
import { isContactOnly, productInquiry, whatsappMessageHref } from "@/lib/contact";
import { productPriceLabel, telHref } from "@/lib/format";
import type { BusinessSettings, Category, Product } from "@/lib/types";
import { AddToCart } from "./add-to-cart";

type Props = { products: Product[]; categories: Category[]; settings: BusinessSettings };

/** Product details over the current page, so customers keep their place in the list. */
export function ProductDialog({ products, categories, settings }: Props) {
  const productId = useProductDialog((s) => s.productId);
  const close = useProductDialog((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);
  const ids = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const product = products.find((p) => p.id === productId) ?? null;
  const category = product ? categories.find((c) => c.id === product.category_id) : null;
  const contactOnly = product ? isContactOnly(product, category?.name) : false;

  // Deep link (?product=<id>) on first load, then follow back/forward.
  useEffect(() => {
    if (productIdFromUrl()) syncProductDialogFromUrl(ids);
    const onPop = () => syncProductDialogFromUrl(ids);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [ids]);

  useModal(!!product, close, panelRef);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="animate-fade-in absolute inset-0 bg-ink/45" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="animate-sheet-in relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-paper shadow-2xl md:max-h-[88vh] md:max-w-[960px] md:rounded-[22px]"
      >
        <button
          type="button"
          onClick={close}
          data-autofocus
          className="absolute end-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_10px_rgba(43,26,26,0.2)] hover:bg-white"
          aria-label="סגירה וחזרה לרשימה"
        >
          <X className="size-5" />
        </button>

        <div className="overflow-y-auto overscroll-contain md:grid md:grid-cols-[1fr_1.05fr]">
          <div className="relative aspect-[4/3] bg-surface md:sticky md:top-0 md:aspect-auto md:h-[min(88vh,640px)] md:self-start">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 470px, 100vw"
                className={product.is_available ? "object-cover" : "object-cover opacity-60 grayscale-[60%]"}
              />
            )}
          </div>

          <div className="flex flex-col px-5 pt-6 md:px-8 md:pt-10">
            {category && <p className="text-[15px] font-semibold text-brand">{category.name}</p>}
            <h2 id="product-dialog-title" className="mt-1 font-display text-[30px] font-semibold leading-[1.1] md:text-[38px]">
              {product.name}
            </h2>
            {(!contactOnly || Number(product.price) > 0) && (
              <p className="tabular mt-3 font-display text-[24px] font-semibold">{productPriceLabel(product)}</p>
            )}
            {product.unit_label && <p className="text-[15px] text-muted">{product.unit_label}</p>}

            {product.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((t) => (
                  <li key={t} className="rounded-full bg-success-soft px-3 py-1 text-[14px] font-semibold text-success">
                    {t}
                  </li>
                ))}
              </ul>
            )}

            {product.description && <p className="mt-5 text-[17px] leading-[1.75]">{product.description}</p>}

{contactOnly ? (
              <div className="mt-6 border-t border-line pb-8 pt-5">
                <p className="text-[17px]">כל הזמנה כאן מותאמת אישית. כתבו לי ונתאם יחד את הפרטים והמחיר.</p>
                {settings.phone && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={whatsappMessageHref(settings.phone, productInquiry(product.name))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[17px] font-semibold text-white transition-colors hover:bg-brand-dark"
                    >
                      <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
                      לתיאום בוואטסאפ
                    </a>
                    <a
                      href={telHref(settings.phone)}
                      className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[17px] font-semibold transition-colors hover:bg-surface"
                    >
                      <Phone className="size-5" strokeWidth={1.75} aria-hidden="true" />
                      <span dir="ltr">{settings.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <AddToCart key={product.id} product={product} inDialog onAdded={close} />
                </div>

                <ul className="mb-8 mt-5 space-y-2.5 border-t border-line pt-5 text-[16px] text-ink/85 md:mt-0">
                  <li className="flex items-center gap-3">
                    <ShoppingBag className="size-[18px] shrink-0 text-brand" strokeWidth={1.75} />
                    {settings.delivery_enabled ? "משלוח או איסוף עצמי, בוחרים יום ושעה בסיום ההזמנה" : "איסוף עצמי, בוחרים יום ושעה בסיום ההזמנה"}
                  </li>
                  {settings.min_lead_hours > 0 && (
                    <li className="flex items-center gap-3">
                      <Clock className="size-[18px] shrink-0 text-brand" strokeWidth={1.75} />
                      מזמינים לפחות {settings.min_lead_hours} שעות מראש
                    </li>
                  )}
                  {settings.phone && (
                    <li className="flex items-center gap-3">
                      <Phone className="size-[18px] shrink-0 text-brand" strokeWidth={1.75} />
                      <span>
                        שאלות על המוצר?{" "}
                        <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline" dir="ltr">
                          {settings.phone}
                        </a>
                      </span>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
