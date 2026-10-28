import type { Metadata, Viewport } from "next";
import { Rubik, Suez_One } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { IS_DEMO } from "@/lib/demo";
import { brand } from "@/config/brand";

const suez = Suez_One({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-suez",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: brand.meta.title,
    template: `%s | ${brand.name}`,
  },
  description: brand.meta.description,
  ...(brand.icon && { icons: { icon: brand.icon } }),
  ...(IS_DEMO && { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: "#fffaf7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" data-scroll-behavior="smooth" className={`${suez.variable} ${rubik.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          toastOptions={{
            style: {
              fontFamily: "var(--font-rubik)",
              fontSize: "16px",
              borderRadius: "14px",
              border: "1px solid var(--color-line)",
              background: "#fff",
              color: "var(--color-ink)",
            },
          }}
        />
      </body>
    </html>
  );
}
