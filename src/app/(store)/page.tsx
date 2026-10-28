import Image from "next/image";
import { Clock, Phone, Store, Truck } from "lucide-react";
import { CategoryNav } from "@/components/store/category-nav";
import { ProductCard } from "@/components/store/product-card";
import { WhatsAppIcon } from "@/components/ui/social-icons";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { isContactOnly, whatsappMessageHref } from "@/lib/contact";
import { telHref } from "@/lib/format";
import { brand } from "@/config/brand";
import type { Product } from "@/lib/types";
import { localizeProduct, localizeSettings, tr } from "@/i18n/catalog";
import { messages } from "@/i18n/messages";
import { getLang } from "@/i18n/server";

/** The whole store on one page: a short intro, then every category with all of its products. */
export default async function HomePage() {
  const [categories, products, rawSettings, lang] = await Promise.all([getCategories(), getProducts(), getSettings(), getLang()]);
  const settings = localizeSettings(rawSettings, lang);
  const t = messages[lang];

  // Within a category: the owner's order, sold-out items last.
  const byCategory = (id: string | null) =>
    products
      .filter((p) => p.category_id === id)
      .sort((a, b) => Number(!a.is_available) - Number(!b.is_available) || a.sort_order - b.sort_order);
  const sections: { id: string; name: string; products: Product[] }[] = categories
    .map((c) => ({ id: c.id, name: c.name, products: byCategory(c.id) }))
    .filter((s) => s.products.length > 0);
  const uncategorized = byCategory(null);
  if (uncategorized.length > 0) sections.push({ id: "more", name: t.more, products: uncategorized });

  return (
    <>
      {/* ── Intro ── */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 pt-6 md:px-8 md:pb-10 md:pt-12">
        {!settings.accepting_orders && (
          <p role="status" className="mb-6 rounded-[var(--radius-panel)] bg-blush px-5 py-4 font-semibold text-brand-dark">
            {settings.closed_message || t.intro.closed}
            {settings.phone && (
              <>
                {" "}{t.intro.orderByPhone}{" "}
                <a href={telHref(settings.phone)} className="underline underline-offset-4" dir="ltr">
                  {settings.phone}
                </a>
              </>
            )}
          </p>
        )}
        <h1 className="max-w-[30ch] font-display text-[26px] font-semibold leading-[1.2] md:text-[44px] md:leading-[1.15]">{t.intro.title}</h1>
        <p className="mt-2 max-w-[56ch] text-[17px] text-muted md:mt-3 md:text-[20px]">{t.intro.line}</p>

        <ul className="mt-5 flex flex-col gap-2 text-[16px] sm:flex-row sm:flex-wrap sm:gap-x-8 md:mt-6 md:text-[17px]">
          <li className="flex items-start gap-2.5">
            {settings.delivery_enabled ? (
              <>
                <Truck className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                <span>{t.intro.deliveryOrPickup(t.serviceArea)}</span>
              </>
            ) : (
              <>
                <Store className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                <span>{t.intro.pickupOnly}</span>
              </>
            )}
          </li>
          {settings.min_lead_hours > 0 && (
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              <span>{t.intro.leadTime(settings.min_lead_hours)}</span>
            </li>
          )}
          {settings.phone && (
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {t.intro.questions}{" "}
                <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline" dir="ltr">
                  {settings.phone}
                </a>
              </span>
            </li>
          )}
        </ul>
      </section>

      {sections.length > 0 && <CategoryNav label={t.categoriesNav} items={sections.map(({ id, name }) => ({ id, name: tr(name, lang) }))} />}

      {/* ── The catalog ── */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        {sections.map((section, si) => {
          const contactSection = brand.contactCategories.includes(section.name);
          return (
            <section
              key={section.id}
              id={`cat-${section.id}`}
              aria-labelledby={`cat-${section.id}-title`}
              className="scroll-mt-[136px] pt-10 md:scroll-mt-[148px] md:pt-14"
            >
              <h2 id={`cat-${section.id}-title`} className="font-display text-[30px] font-semibold leading-tight text-brand md:text-[40px]">
                {tr(section.name, lang)}
                <Flourish />
              </h2>
              {contactSection && (
                <p className="mt-2 max-w-[56ch] text-[17px] text-muted">
                  {t.contactSectionNote}
                </p>
              )}
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
                {section.products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={localizeProduct(p, lang)}
                    contactOnly={isContactOnly(p, section.name)}
                    phone={settings.phone}
                    priority={si === 0 && i < 4}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── About + contact ── */}
      {brand.story && (
        <section id="about" aria-labelledby="about-title" className="mx-auto mt-20 max-w-[1200px] scroll-mt-28 px-4 md:mt-28 md:px-8">
          <div className="grid items-center gap-8 overflow-hidden rounded-[var(--radius-panel)] bg-blush md:grid-cols-[1.1fr_1fr] md:gap-0">
            {brand.story.image && (
              <div className="relative aspect-[7/4] bg-ink md:order-last md:aspect-auto md:h-full md:min-h-[320px]">
                <Image src={brand.story.image.src} alt={t.story.imageAlt} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
              </div>
            )}
            <div className="px-5 pb-8 md:px-12 md:py-12">
              <h2 id="about-title" className="font-display text-[30px] font-semibold leading-tight text-brand md:text-[38px]">
                {t.story.title}
              </h2>
              {t.story.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 max-w-[48ch] text-[18px] leading-[1.7]">
                  {p}
                </p>
              ))}
              {settings.phone && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={whatsappMessageHref(settings.phone, t.whatsapp.hello)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[17px] font-semibold transition-colors hover:bg-[#25D366]/10"
                  >
                    <WhatsAppIcon className="size-6" />
                    {t.story.whatsapp}
                  </a>
                  <a
                    href={telHref(settings.phone)}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[17px] font-semibold transition-colors hover:bg-white/70"
                  >
                    <Phone className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    <span dir="ltr">{settings.phone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** The curl-and-heart from the logo's border, drawn after each category name. */
function Flourish() {
  return (
    <svg viewBox="0 0 120 24" className="ms-3 inline-block h-6 w-[100px] align-middle text-brand md:w-[120px] ltr:-scale-x-100" aria-hidden="true" fill="none">
      <path d="M109 19c-7-4.5-9-10-4.6-12.4 2.2-1.2 4 0 4.6 1.6.6-1.6 2.4-2.8 4.6-1.6C118 9 116 14.5 109 19Z" fill="currentColor" />
      <path
        d="M98 12c-9-6-17 6-25 0s-9-8-14-4 0 9 5 6M58 12c-8 6-15-6-24 0s-16 4-21-1-9 1-11 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
