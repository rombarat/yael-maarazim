"use client";

import { useEffect, useRef } from "react";
import { fetchCartProducts } from "@/app/(store)/actions";
import { useCart } from "@/lib/cart-store";

/**
 * Refreshes cart prices/availability from the live menu whenever `active` turns true,
 * so a price change or "sold out" in the admin shows up in an existing cart.
 */
export function useCartSync(active: boolean) {
  const sync = useCart((s) => s.sync);
  const running = useRef(false);

  useEffect(() => {
    if (!active || running.current) return;
    const ids = [...new Set(useCart.getState().lines.map((l) => l.productId))];
    if (!ids.length) return;
    running.current = true;
    fetchCartProducts(ids)
      .then((products) => sync(products))
      .catch(() => {})
      .finally(() => {
        running.current = false;
      });
  }, [active, sync]);
}
