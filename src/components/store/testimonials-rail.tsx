"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/client";
import type { Testimonial } from "@/config/testimonials";

/** Customer messages side by side: swipe on a phone, arrows on a computer. */
export function TestimonialsRail({ items }: { items: Testimonial[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const t = useT();

  // "Next" is towards the end of the reading direction: left in Hebrew, right in English.
  const scroll = (towardsEnd: boolean) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.getBoundingClientRect().width ?? 300) + 16;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: (towardsEnd ? 1 : -1) * (rtl ? -step : step), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={rail}
        className="rail -mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {items.map((q, i) => (
          <li
            key={i}
            className="flex w-[82%] max-w-[380px] shrink-0 snap-start flex-col justify-center overflow-hidden rounded-[var(--radius-panel)] bg-rose-soft p-2 sm:w-[46%] lg:w-[31.5%]"
          >
            {q.image && (
              <Image
                src={q.image.src}
                alt={q.image.alt}
                width={q.image.width}
                height={q.image.height}
                sizes="(min-width: 1024px) 370px, (min-width: 640px) 46vw, 82vw"
                className="h-auto w-full rounded-[10px]"
              />
            )}
            {(q.text || q.name) && (
              <div className="p-4">
                {q.text && <blockquote className="text-[17px] leading-[1.7]">{q.text}</blockquote>}
                {q.name && <p className="mt-3 font-semibold text-forest">{q.name}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden justify-center gap-3 md:flex">
        <button
          type="button"
          onClick={() => scroll(false)}
          aria-label={t.testimonialsPrev}
          className="flex size-11 items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-brand/40"
        >
          <ChevronRight className="size-5 ltr:rotate-180" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => scroll(true)}
          aria-label={t.testimonialsNext}
          className="flex size-11 items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-brand/40"
        >
          <ChevronLeft className="size-5 ltr:rotate-180" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
