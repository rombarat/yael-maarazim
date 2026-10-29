"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Item = { id: string; name: string };

/**
 * Sticky row of category chips under the header. Each chip jumps to its section (plain anchors, so it
 * works before JavaScript loads); while scrolling, the chip of the section on screen is highlighted
 * and kept in view.
 */
export function CategoryNav({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  /** Set while a click scrolls the page, so the observer doesn't flicker through the sections in between. */
  const lockUntil = useRef(0);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(`cat-${i.id}`)).filter((s): s is HTMLElement => !!s);
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.slice(4));
      },
      // A thin band just below the sticky header and chips.
      { rootMargin: "-150px 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active chip visible inside the horizontal rail (RTL-safe: works with on-screen positions).
  useEffect(() => {
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!rail || !chip) return;
    const r = rail.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.left < r.left + 16 || c.right > r.right - 16) {
      rail.scrollBy({ left: c.left + c.width / 2 - (r.left + r.width / 2), behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav aria-label={label} className="sticky top-[72px] z-30 border-b border-line bg-paper/95 backdrop-blur-md md:top-20">
      <div ref={railRef} className="rail mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-3 md:px-8">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#cat-${item.id}`}
            data-id={item.id}
            aria-current={active === item.id ? "true" : undefined}
            onClick={() => {
              lockUntil.current = Date.now() + 900;
              setActive(item.id);
            }}
            className={clsx(
              "flex h-10 shrink-0 items-center rounded-full px-4 text-[16px] font-semibold transition-colors",
              active === item.id ? "bg-forest text-white" : "bg-rose-soft text-ink hover:bg-rose",
            )}
          >
            {item.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
