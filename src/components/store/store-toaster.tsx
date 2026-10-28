"use client";

import { Toaster } from "sonner";
import { dirOf } from "@/i18n";
import { useLang } from "@/i18n/client";

/** Storefront toasts follow the shopper's language; pass `toasterId: STORE_TOASTER`. The admin keeps the root Toaster. */
export const STORE_TOASTER = "store";

export function StoreToaster() {
  const lang = useLang();
  return (
    <Toaster
      id={STORE_TOASTER}
      position="top-center"
      dir={dirOf(lang)}
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
          fontSize: "16px",
          borderRadius: "14px",
          border: "1px solid var(--color-line)",
          background: "#fff",
          color: "var(--color-ink)",
        },
      }}
    />
  );
}
