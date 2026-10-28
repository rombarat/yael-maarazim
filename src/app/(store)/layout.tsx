import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CookieConsent } from "@/components/store/cookie-consent";
import { ProductDialog } from "@/components/store/product-dialog";
import { StoreToaster } from "@/components/store/store-toaster";
import { CartHydrator } from "@/lib/cart-store";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { LangProvider } from "@/i18n/client";
import { localizeProduct, localizeSettings } from "@/i18n/catalog";
import { dirOf } from "@/i18n";
import { getLang } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, products, categories, lang] = await Promise.all([getSettings(), getProducts(), getCategories(), getLang()]);
  return (
    // The language and direction live on the store wrapper, so the admin stays Hebrew and right-to-left.
    <div className="store" lang={lang} dir={dirOf(lang)}>
      <LangProvider lang={lang}>
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {lang === "en" ? "Skip to content" : "דילוג לתוכן"}
        </a>
        <CartHydrator />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter settings={settings} lang={lang} />
        <CartDrawer />
        <ProductDialog
          products={products.map((p) => localizeProduct(p, lang))}
          categories={categories}
          settings={localizeSettings(settings, lang)}
        />
        <CookieConsent />
        <StoreToaster />
      </LangProvider>
    </div>
  );
}
