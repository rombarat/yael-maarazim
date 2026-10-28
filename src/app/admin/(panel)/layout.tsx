import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/server/auth";
import { getNewOrderCount } from "@/lib/admin-data";

export const metadata: Metadata = { title: "ניהול", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell newCount={await getNewOrderCount()}>{children}</AdminShell>;
}
