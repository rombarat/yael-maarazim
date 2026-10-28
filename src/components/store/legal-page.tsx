import Link from "next/link";
import { brand } from "@/config/brand";
import { telHref } from "@/lib/format";
import type { BusinessSettings } from "@/lib/types";

export const LEGAL_LINKS = [
  { href: "/terms", label: "תקנון האתר" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/cookies", label: "מדיניות עוגיות" },
  { href: "/accessibility", label: "הצהרת נגישות" },
];

/** Shared frame for the legal pages: title, date, readable column, links to the sibling pages. */
export function LegalPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[760px] px-4 pt-10 md:px-8 md:pt-14">
      <h1 className="font-display text-[40px] leading-tight md:text-[52px]">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">עודכן לאחרונה: {brand.legal.lastUpdated}</p>
      <div className="legal mt-8">{children}</div>
      <nav aria-label="מסמכים משפטיים" className="mt-14 border-t border-line pt-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
          {LEGAL_LINKS.filter((l) => l.href !== current).map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="font-semibold text-brand underline-offset-4 hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** "How to reach us" line built from the live business settings. */
export function ContactLine({ settings }: { settings: BusinessSettings }) {
  return (
    <>
      {settings.phone && (
        <>
          בטלפון או בוואטסאפ{" "}
          <a href={telHref(settings.phone)} dir="ltr">
            {settings.phone}
          </a>
        </>
      )}
      {settings.phone && settings.email && ", או "}
      {settings.email && (
        <>
          בדוא״ל <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </>
      )}
    </>
  );
}

/** The operator's identity, as required in distance sales. Empty fields are left out. */
export function OperatorDetails() {
  const { operator, ownerLegalName, businessId, businessAddress } = brand.legal;
  return (
    <ul>
      <li>שם העסק: {operator}</li>
      {ownerLegalName && <li>בעלת העסק: {ownerLegalName}</li>}
      {businessId && <li>מספר עוסק: {businessId}</li>}
      {businessAddress && <li>כתובת: {businessAddress}</li>}
    </ul>
  );
}
