"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, LayoutDashboard, LogOut, Package, Receipt, Settings } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { latestOrder, logout, ordersPulse } from "@/app/admin/actions";
import { BrandMark } from "@/components/ui/brand-mark";

const NAV = [
  { href: "/admin", label: "סקירה", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "הזמנות", icon: Receipt },
  { href: "/admin/products", label: "מוצרים", icon: Package },
  { href: "/admin/pickup", label: "איסוף ומשלוחים", icon: CalendarDays },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

export function AdminShell({ children, newCount }: { children: ReactNode; newCount: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href) || (item.href === "/admin/products" && pathname.startsWith("/admin/categories"));

  // A new order appears without a manual refresh: poll a tiny endpoint, refresh when something changed.
  const seen = useRef<{ latest: number | null; newCount: number } | null>(null);
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await ordersPulse().catch(() => null);
      if (stopped || !res?.ok) return;
      const prev = seen.current;
      seen.current = res.data;
      if (!prev) return;
      if (res.data.latest !== null && (prev.latest === null || res.data.latest > prev.latest)) {
        const order = await latestOrder();
        if (order.ok && order.data) {
          const { id, order_number, customer_name } = order.data;
          toast(`הזמנה חדשה #${order_number}`, {
            description: customer_name,
            duration: 10000,
            action: { label: "לצפייה", onClick: () => router.push(`/admin/orders/${id}`) },
          });
        }
        router.refresh();
      } else if (res.data.newCount !== prev.newCount) {
        router.refresh();
      }
    };
    check();
    const timer = setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  const signOut = async () => {
    await logout();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-[#faf6f3] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-white md:flex">
        <div className="px-6 pb-4 pt-6">
          <BrandMark className="h-11 w-auto" textClassName="text-[28px]" />
          <p className="mt-1 text-[13px] text-muted">ניהול החנות</p>
        </div>
        <nav aria-label="ניהול" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={clsx(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-[16px] font-semibold transition-colors",
                    isActive(item) ? "bg-surface text-ink" : "text-muted hover:bg-surface/60 hover:text-ink",
                  )}
                >
                  <item.icon className="size-5" strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/orders" && newCount > 0 && (
                    <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-full bg-alert px-1.5 text-[12px] font-bold text-white">
                      {newCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <a href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-surface/60 hover:text-ink">
            <ExternalLink className="size-[18px]" />
            צפייה בחנות
          </a>
          <button type="button" onClick={signOut} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-surface/60 hover:text-ink">
            <LogOut className="size-[18px]" />
            התנתקות
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur-md md:hidden">
        <BrandMark className="h-9 w-auto" textClassName="text-[22px]" />
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="צפייה בחנות">
            <ExternalLink className="size-5" />
          </a>
          <button type="button" onClick={signOut} className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="התנתקות">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-10">
        <div className="mx-auto max-w-[1080px]">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="ניהול" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={clsx(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold",
                  isActive(item) ? "text-brand" : "text-muted",
                )}
              >
                <item.icon className="size-[22px]" strokeWidth={isActive(item) ? 2.25 : 1.75} />
                {item.label}
                {item.href === "/admin/orders" && newCount > 0 && (
                  <span className="tabular absolute top-1.5 start-[calc(50%+6px)] flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1 text-[11px] font-bold text-white">
                    {newCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
