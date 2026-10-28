"use client";

import { create } from "zustand";

/**
 * Which product is shown in the product dialog. The id is mirrored in the URL (?product=<id>) so the
 * phone's back button closes the dialog and the link can be shared.
 */
type ProductDialogState = {
  productId: string | null;
  open: (id: string) => void;
  close: () => void;
};

const PARAM = "product";
/** True when the open dialog added its own history entry (then closing goes back instead of replacing). */
let pushedEntry = false;

function urlWith(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAM, id);
  else url.searchParams.delete(PARAM);
  return url;
}

export const useProductDialog = create<ProductDialogState>((set, get) => ({
  productId: null,
  open: (id) => {
    if (get().productId === id) return;
    if (get().productId) window.history.replaceState(null, "", urlWith(id));
    else {
      window.history.pushState(null, "", urlWith(id));
      pushedEntry = true;
    }
    set({ productId: id });
  },
  close: () => {
    if (!get().productId) return;
    set({ productId: null });
    if (pushedEntry) {
      pushedEntry = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", urlWith(null));
    }
  },
}));

/** The product id in the current URL, if any (deep links and back/forward). */
export function productIdFromUrl() {
  return new URL(window.location.href).searchParams.get(PARAM);
}

/** Called on back/forward: follow the URL without touching history again. */
export function syncProductDialogFromUrl(validIds: Set<string>) {
  const id = productIdFromUrl();
  if (!id) pushedEntry = false;
  useProductDialog.setState({ productId: id && validIds.has(id) ? id : null });
}
