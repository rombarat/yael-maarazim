import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/social-icons";
import { summarizeHours } from "@/lib/pickup";
import { telHref, whatsappHref } from "@/lib/format";
import type { BusinessSettings } from "@/lib/types";
import type { Lang } from "@/i18n";
import { messages } from "@/i18n/messages";
import { brand } from "@/config/brand";
import { CookieSettingsLink } from "./cookie-consent";
import { LEGAL_LINKS } from "./legal-page";

export function SiteFooter({ settings, lang }: { settings: BusinessSettings; lang: Lang }) {
  const t = messages[lang];
  const hours = summarizeHours(settings.weekly_hours, t.weekdays);
  return (
    <footer className="mt-24 bg-forest text-[#f3ece4]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex size-28 items-center justify-center rounded-full bg-white p-2">
            <Image src={brand.badge.src} alt={lang === "en" ? "Yael Metukim Be'ahava logo" : brand.badge.alt} width={brand.badge.width} height={brand.badge.height} className="h-full w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/70">{t.footer.blurb}</p>
        </div>

        {(settings.phone || settings.email) && (
          <div>
            <h2 className="font-display text-[22px] text-white">{t.footer.orders}</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              {settings.phone && (
                <>
                  <li>
                    <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 hover:text-white">
                      <Phone className="size-4" aria-hidden="true" />
                      <span dir="ltr">{settings.phone}</span>
                    </a>
                  </li>
                  <li>
                    <a href={whatsappHref(settings.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                      <WhatsAppIcon className="size-4" />
                      {t.footer.whatsapp}
                    </a>
                  </li>
                </>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 break-all hover:text-white">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        <div>
          <h2 className="font-display text-[22px] text-white">{t.footer.hours}</h2>
          <ul className="mt-3 space-y-1 text-[15px]">
            {hours.map((h) => (
              <li key={h.days}>
                {h.days} <span className="tabular" dir="ltr">{h.hours}</span>
              </li>
            ))}
          </ul>
          {settings.delivery_enabled && <p className="mt-3 text-[14px] leading-relaxed text-white/70">{t.footer.deliveries(t.serviceArea)}</p>}
        </div>

        <div>
          {(settings.instagram_url || settings.facebook_url) && (
            <>
              <h2 className="font-display text-[22px] text-white">{t.footer.follow}</h2>
              <ul className="mt-3 flex gap-2">
                {settings.instagram_url && (
                  <li>
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="size-5" />
                    </a>
                  </li>
                )}
                {settings.facebook_url && (
                  <li>
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                      aria-label="Facebook"
                    >
                      <FacebookIcon className="size-5" />
                    </a>
                  </li>
                )}
              </ul>
            </>
          )}
          <h2 className="mt-6 font-display text-[22px] text-white">{t.footer.info}</h2>
          <ul className="mt-3 space-y-1.5 text-[15px]">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white hover:underline">
                  {t.footer.legal[l.href] ?? l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink className="hover:text-white hover:underline" label={t.footer.cookieSettings} />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 text-[13px] text-[#c4a9a5] md:px-8">
          <span>© {new Date().getFullYear()} {brand.name}</span>
          <Link href="/admin" className="hover:text-white">
            {t.footer.admin}
          </Link>
        </div>
      </div>
    </footer>
  );
}
