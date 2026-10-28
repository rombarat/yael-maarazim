import type { Metadata } from "next";
import { CookieSettingsLink } from "@/components/store/cookie-consent";
import { LegalPage } from "@/components/store/legal-page";

export const metadata: Metadata = { title: "מדיניות עוגיות" };

export default function CookiesPage() {
  return (
    <LegalPage title="מדיניות עוגיות" current="/cookies">
      <p>
        עוגיות (Cookies) הן קבצים קטנים שאתר שומר בדפדפן. בנוסף לעוגיות, האתר שומר מעט מידע ב״אחסון המקומי״ של הדפדפן. כך
        האתר זוכר, למשל, מה הכנסתם לסל.
      </p>

      <h2>במה האתר משתמש</h2>
      <p>כרגע האתר משתמש רק במה שהכרחי כדי שיעבוד. אין באתר כלי פרסום, מעקב או סטטיסטיקה של צד שלישי.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">שם</th>
            <th scope="col">סוג</th>
            <th scope="col">למה</th>
            <th scope="col">משך</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td dir="ltr">yael-cart</td>
            <td>אחסון מקומי, הכרחי</td>
            <td>שומר את המוצרים בסל הקניות</td>
            <td>עד שמרוקנים את הסל</td>
          </tr>
          <tr>
            <td dir="ltr">cookie-consent</td>
            <td>אחסון מקומי, הכרחי</td>
            <td>זוכר את הבחירה שלכם בהודעת העוגיות</td>
            <td>עד שמוחקים אותו</td>
          </tr>
          <tr>
            <td dir="ltr">store_admin</td>
            <td>עוגייה, הכרחית</td>
            <td>שומרת את ההתחברות לממשק הניהול. נוצרת רק לבעלת העסק</td>
            <td>עד 30 יום</td>
          </tr>
        </tbody>
      </table>

      <h2>הבחירה שלכם</h2>
      <p>
        בהודעת העוגיות אפשר לבחור ״אישור״ או ״הכרחיות בלבד״. אם בעתיד נוסיף כלי מדידה או פרסום, הם יופעלו רק אצל מי שבחר
        ״אישור״, והטבלה כאן תעודכן.
      </p>
      <p>
        אפשר לשנות את הבחירה בכל רגע: <CookieSettingsLink className="font-semibold text-brand underline underline-offset-[3px]" />. אפשר גם
        למחוק עוגיות ואחסון מקומי בהגדרות הדפדפן. מחיקה תרוקן את סל הקניות.
      </p>
    </LegalPage>
  );
}
