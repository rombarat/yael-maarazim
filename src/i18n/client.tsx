"use client";

import { createContext, useContext } from "react";
import type { Lang } from "./index";
import { messages } from "./messages";

const LangContext = createContext<Lang>("he");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** The storefront strings in the current language. */
export function useT() {
  return messages[useContext(LangContext)];
}
