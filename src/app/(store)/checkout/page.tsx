import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getBlockedDates, getSettings } from "@/lib/catalog";
import { localizeSettings } from "@/i18n/catalog";
import { messages } from "@/i18n/messages";
import { getLang } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messages[await getLang()].checkout.title };
}

export default async function CheckoutPage() {
  const [settings, blocked, lang] = await Promise.all([getSettings(), getBlockedDates(), getLang()]);
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-[42px] font-semibold leading-none md:text-[56px]">{messages[lang].checkout.title}</h1>
      <CheckoutForm settings={localizeSettings(settings, lang)} blocked={blocked} />
    </div>
  );
}
