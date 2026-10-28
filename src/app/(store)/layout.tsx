import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CookieConsent } from "@/components/store/cookie-consent";
import { ProductDialog } from "@/components/store/product-dialog";
import { CartHydrator } from "@/lib/cart-store";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, products, categories] = await Promise.all([getSettings(), getProducts(), getCategories()]);
  return (
    <div className="store">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        דילוג לתוכן
      </a>
      <CartHydrator />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <CartDrawer />
      <ProductDialog products={products} categories={categories} settings={settings} />
      <CookieConsent />
    </div>
  );
}
