import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdmin } from "@/server/auth";
import { LoginForm } from "@/components/admin/login-form";
import { BrandMark } from "@/components/ui/brand-mark";

export const metadata: Metadata = { title: "כניסה לניהול", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark priority className="h-16 w-auto" textClassName="text-[40px]" />
          <h1 className="mt-6 font-display text-[34px] leading-none">ניהול החנות</h1>
          <p className="mt-2 text-muted">הזמנות, מוצרים, איסוף ומשלוחים במקום אחד</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
