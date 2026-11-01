"use client";

import { useEffect } from "react";

/** Opens the category named in the URL (#cat-<id>, e.g. from an old /shop?category= link) and scrolls to it. */
export function OpenCategoryFromHash() {
  useEffect(() => {
    const open = () => {
      const el = window.location.hash.startsWith("#cat-") ? document.getElementById(window.location.hash.slice(1)) : null;
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
