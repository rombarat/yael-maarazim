"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useT } from "@/i18n/client";

/**
 * Small cookie notice. The site itself only uses what it needs to work (the cart in the browser's
 * storage, the admin login cookie). "Optional" covers anything added later, such as analytics:
 * check `hasOptionalConsent()` before loading it.
 */
const KEY = "cookie-consent";
const OPEN_EVENT = "cookie-consent:open";
export type ConsentChoice = "all" | "essential";

function readChoice(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { choice } = JSON.parse(raw) as { choice: ConsentChoice };
    return choice === "all" || choice === "essential" ? choice : null;
  } catch {
    return null;
  }
}

export function hasOptionalConsent() {
  return readChoice() === "all";
}

/** Reopens the notice, e.g. from the footer link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!readChoice()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (choice: ConsentChoice) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      // Private mode: the choice just won't be remembered.
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label={t.cookies.region}
      className="animate-fade-in fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[420px] rounded-[var(--radius-panel)] border border-line bg-white p-4 shadow-[0_10px_40px_-12px_rgba(43,26,26,0.35)] sm:inset-x-auto sm:start-5 sm:bottom-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-[15px] leading-snug">
          {t.cookies.text}{" "}
          <Link href="/cookies" className="font-semibold text-brand underline underline-offset-2">
            {t.cookies.policy}
          </Link>
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose("all")}
          className="h-11 flex-1 rounded-full bg-brand px-4 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {t.cookies.accept}
        </button>
        <button
          type="button"
          onClick={() => choose("essential")}
          className="h-11 flex-1 rounded-full border border-line px-4 font-semibold text-ink transition-colors hover:bg-surface"
        >
          {t.cookies.essential}
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ className, label = "הגדרות עוגיות" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {label}
    </button>
  );
}
