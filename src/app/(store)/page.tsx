import Image from "next/image";
import Link from "next/link";
import { Clock, MessageCircle, Phone, ShoppingBag, Truck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { summarizeHours } from "@/lib/pickup";
import { telHref, whatsappHref } from "@/lib/format";
import { brand } from "@/config/brand";

export default async function HomePage() {
  const [categories, products, settings] = await Promise.all([getCategories(), getProducts(), getSettings()]);
  const featured = products.filter((p) => p.is_featured && p.is_available).slice(0, 8);
  const hours = summarizeHours(settings.weekly_hours);
  const categoryTiles = categories
    .map((c) => {
      const inCategory = products.filter((p) => p.category_id === c.id);
      return { ...c, count: inCategory.length, image_url: c.image_url ?? inCategory.find((p) => p.image_url)?.image_url ?? null };
    })
    .filter((c) => c.count > 0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 md:grid md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12 md:px-8 md:pt-14 lg:gap-20">
        <div className="md:pb-10">
          <p className="text-[16px] font-semibold text-brand">{brand.hero.eyebrow}</p>
          <h1 className="mt-2 font-display text-[52px] leading-[1.02] text-brand md:text-[80px]">{brand.name}</h1>
          <p className="mt-5 max-w-[30ch] text-[19px] leading-relaxed text-ink/85 md:text-[21px]">
            {brand.hero.line}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <LinkButton href="/shop" size="lg" icon={<ShoppingBag className="size-5" strokeWidth={1.75} />}>
              להזמנה
            </LinkButton>
            {settings.phone && (
              <a
                href={telHref(settings.phone)}
                className="inline-flex h-[52px] items-center gap-2 rounded-full px-4 font-semibold text-ink hover:bg-surface"
              >
                <Phone className="size-[18px]" />
                <span dir="ltr">{settings.phone}</span>
              </a>
            )}
          </div>
        </div>

        {brand.hero.image && (
          <div className="relative mt-10 md:mt-0">
            <div className="arch relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden bg-surface">
              <Image
                src={brand.hero.image.src}
                alt={brand.hero.image.alt}
                fill
                priority
                sizes="(min-width: 768px) 520px, 100vw"
                className="object-cover"
                style={{ objectPosition: brand.hero.image.position ?? "50% 50%" }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Practical info ── */}
      <section aria-label="מידע להזמנה" className="mx-auto mt-10 max-w-[1200px] px-4 md:px-8">
        <ul className={`grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line ${settings.phone ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <li className="flex items-center gap-3 bg-white px-5 py-4">
            {settings.delivery_enabled ? (
              <>
                <Truck className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
                <span>איסוף עצמי או משלוח ל{brand.legal.serviceArea}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
                <span>מזמינים באתר, אוספים בעצמכם</span>
              </>
            )}
          </li>
          <li className="flex items-center gap-3 bg-white px-5 py-4">
            <Clock className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
            <span>
              {hours.map((h) => (
                <span key={h.days} className="block">
                  {h.days} <span className="tabular whitespace-nowrap" dir="ltr">{h.hours}</span>
                </span>
              ))}
            </span>
          </li>
          {settings.phone && (
            <li className="flex items-center gap-3 bg-white px-5 py-4">
              <Phone className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
              <span>
                שאלות? <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline" dir="ltr">{settings.phone}</a>
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* ── Categories ── */}
      <section aria-labelledby="cats-title" className="mt-20">
        <div className="mx-auto flex max-w-[1200px] items-end justify-between px-4 md:px-8">
          <h2 id="cats-title" className="font-display text-[34px] leading-none md:text-[46px]">
            {brand.home.categoriesTitle}
          </h2>
          <Link href="/shop" className="pb-1 text-[16px] font-semibold text-brand underline-offset-4 hover:underline">
            לכל המוצרים
          </Link>
        </div>
        <ul className="rail mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-auto md:grid md:max-w-[1200px] md:grid-cols-4 md:gap-5 md:overflow-visible md:px-8 lg:grid-cols-7 lg:gap-4">
          {categoryTiles.map((c) => (
            <li key={c.id} className="w-[42vw] max-w-[200px] shrink-0 snap-start md:w-auto md:max-w-none">
              <Link href={`/shop?category=${c.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-photo)] bg-surface">
                  {c.image_url && (
                    <Image
                      src={c.image_url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 220px, 42vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <p className="mt-3 font-display text-[21px] leading-tight">{c.name}</p>
                <p className="mt-1 text-[14px] text-muted">{c.count} מוצרים</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="mx-auto mt-20 max-w-[1200px] px-4 md:px-8">
          <h2 id="featured-title" className="font-display text-[34px] leading-none md:text-[46px]">
            {brand.home.featuredTitle}
          </h2>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <LinkButton href="/shop" variant="secondary" size="lg">
              לכל {products.length} המוצרים
            </LinkButton>
          </div>
        </section>
      )}

      {/* ── Custom work (priced per event, ordered by phone) ── */}
      {brand.custom.items.length > 0 && (
        <section aria-labelledby="custom-title" className="mx-auto mt-24 max-w-[1200px] px-4 md:px-8">
          <div className="max-w-[52ch]">
            <h2 id="custom-title" className="font-display text-[34px] leading-none md:text-[46px]">
              {brand.custom.title}
            </h2>
            <p className="mt-4 text-[18px] leading-relaxed text-ink/85">{brand.custom.intro}</p>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {brand.custom.items.map((item) => (
              <li key={item.title}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-photo)] bg-surface">
                  <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 768px) 380px, 100vw" className="object-cover" />
                </div>
                <h3 className="mt-4 text-[20px] font-bold">{item.title}</h3>
                <p className="mt-1 text-muted">{item.body}</p>
                {settings.phone && (
                  <a
                    href={`${whatsappHref(settings.phone)}?text=${encodeURIComponent(`היי יעל, אשמח לשמוע על ${item.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-surface"
                  >
                    <MessageCircle className="size-[18px]" />
                    לתיאום בוואטסאפ
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Story ── */}
      {brand.story && (
        <section id="story" aria-labelledby="story-title" className="mt-24 scroll-mt-24 bg-surface">
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24">
            {brand.story.image && (
              <div className="relative mx-auto aspect-[7/4] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-photo)] bg-ink md:order-last">
                <Image src={brand.story.image.src} alt={brand.story.image.alt} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
              </div>
            )}
            <div className="max-w-[46ch]">
              <h2 id="story-title" className="font-display text-[34px] leading-tight md:text-[46px]">
                {brand.story.title}
              </h2>
              {brand.story.paragraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "mt-5 text-[18px] leading-[1.75]" : "mt-4 text-[18px] leading-[1.75]"}>
                  {p}
                  {i === brand.story!.paragraphs.length - 1 && brand.story!.contactCta && settings.phone && (
                    <>
                      {" "}
                      <a href={telHref(settings.phone)} className="font-semibold text-brand underline underline-offset-4">
                        {brand.story!.contactCta}
                      </a>
                    </>
                  )}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How to order ── */}
      <section id="how" aria-labelledby="how-title" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-4 md:px-8">
        <h2 id="how-title" className="font-display text-[34px] leading-none md:text-[46px]">
          איך מזמינים?
        </h2>
        <ol className="mt-9 grid gap-8 md:grid-cols-3 md:gap-10">
          {brand.howToOrder.map((step, i) => (
            <li key={step.title} className="flex gap-5 md:flex-col md:gap-4">
              <span className="font-display text-[56px] leading-[0.8] text-accent" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[19px] font-bold">{step.title}</h3>
                <p className="mt-1 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <LinkButton href="/shop" size="lg">
            להזמנה
          </LinkButton>
        </div>
      </section>
    </>
  );
}
