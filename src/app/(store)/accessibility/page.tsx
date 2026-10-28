import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/store/legal-page";
import { getSettings } from "@/lib/catalog";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "הצהרת נגישות" };

export default async function AccessibilityPage() {
  const settings = await getSettings();
  return (
    <LegalPage title="הצהרת נגישות" current="/accessibility">
      <p>
        חשוב לנו שכל אחד ואחת יוכלו להזמין אצלנו בקלות. האתר נבנה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
        נגישות לשירות), התשע״ג־2013, ולתקן הישראלי 5568, המבוסס על הנחיות WCAG 2.0 ברמה AA.
      </p>

      <h2>מה עשינו באתר</h2>
      <ul>
        <li>האתר מותאם לקוראי מסך, עם כותרות מסודרות, תוויות לכל שדה ותיאור טקסטואלי לתמונות.</li>
        <li>אפשר לנווט בכל האתר באמצעות המקלדת בלבד, והרכיב שבפוקוס מסומן בבירור.</li>
        <li>קישור ״דילוג לתוכן״ בראש כל עמוד.</li>
        <li>ניגודיות צבעים מספקת בין הטקסט לרקע.</li>
        <li>האתר מותאם לטלפונים, לטאבלטים ולמחשבים, ואפשר להגדיל את הטקסט בדפדפן בלי לאבד תוכן.</li>
        <li>הודעות שגיאה בטפסים מסבירות מה קרה ואיך לתקן.</li>
        <li>אצל מי שהגדיר במכשיר ״הפחתת תנועה״, האנימציות מבוטלות.</li>
      </ul>

      <h2>הסדרי נגישות בעסק</h2>
      <p>
        אם קשה לכם להזמין באתר, אפשר להזמין גם בטלפון או בוואטסאפ, ונשמח לעזור.
        {settings.delivery_enabled && ` יש גם אפשרות למשלוח עד הבית לאזור ${brand.legal.serviceArea}.`}
      </p>

      <h2>נתקלתם בבעיה?</h2>
      <p>
        למרות המאמצים, ייתכן שחלק מהעמודים עדיין לא נגישים במלואם. אם מצאתם בעיה, נשמח לשמוע ולתקן. פנו לרכזת הנגישות,
        {brand.ownerName && ` ${brand.ownerName},`} <ContactLine settings={settings} />. כדאי לציין את העמוד, מה ניסיתם לעשות ובאיזה מכשיר
        ודפדפן השתמשתם.
      </p>
    </LegalPage>
  );
}
