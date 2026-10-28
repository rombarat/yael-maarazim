import { PageHeader } from "@/components/admin/page-parts";
import { PickupSettings } from "@/components/admin/pickup-settings";
import { BlockedDates } from "@/components/admin/blocked-dates";
import { getBlockedDates, getSettings } from "@/lib/catalog";
import { israelNow } from "@/lib/pickup";

export default async function PickupPage() {
  const [settings, blocked] = await Promise.all([getSettings(), getBlockedDates()]);
  const today = israelNow().date;
  return (
    <>
      <PageHeader title="איסוף ומשלוחים" description="קובעים מתי לקוחות יכולים לאסוף או לקבל משלוח. החנות מציעה רק מועדים שמתאימים להגדרות כאן." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start">
        <PickupSettings settings={settings} />
        <BlockedDates blocked={blocked.filter((b) => b.date >= today)} today={today} />
      </div>
    </>
  );
}
