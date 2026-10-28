"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LANG_COOKIE } from "@/i18n";
import { useLang, useT } from "@/i18n/client";

/** Switches the storefront between Hebrew and English. The choice is kept in a cookie for a year. */
export function LanguageSwitch() {
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const next = lang === "en" ? "he" : "en";

  const toggle = () => {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      lang={next}
      aria-label={t.langSwitch.aria}
      className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[15px] font-semibold transition-colors hover:border-brand/40 disabled:opacity-60 md:px-3"
    >
      <Globe className="hidden size-[18px] md:block" strokeWidth={1.75} aria-hidden="true" />
      <span className="md:hidden">{next === "en" ? "EN" : "עב"}</span>
      <span className="hidden md:inline">{t.langSwitch.label}</span>
    </button>
  );
}
