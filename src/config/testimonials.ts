/**
 * "לקוחות מספרים" on the home page, per language. The section stays hidden while a list is empty.
 * Only real customer words, as the owner sends them: a quote (`text`, optional `name`), or a screenshot of
 * the message (`image`, files in public/testimonials/), or both.
 */
export type Testimonial = { text?: string; name?: string; image?: { src: string; alt: string; width: number; height: number } };

const SIZES = [
  { width: 800, height: 338 },
  { width: 800, height: 659 },
  { width: 800, height: 316 },
  { width: 800, height: 576 },
  { width: 800, height: 392 },
  { width: 800, height: 534 },
  { width: 800, height: 359 },
  { width: 800, height: 329 },
  { width: 722, height: 375 },
  { width: 800, height: 438 },
  { width: 800, height: 642 },
  { width: 800, height: 455 },
  { width: 800, height: 408 },
  { width: 800, height: 951 },
  { width: 800, height: 499 },
];

const HE = [
  "היי יעל, רק רציתי לומר תודה ענקית על העוגה! היא היתה יפייפיה, מקושטת מדהים והכי חשוב טעימה ברמות, לא נשאר אפילו פירור. תודה ענקית על הכל!",
  "תודה רבה רבה על המשלוח המפנק. המקבלים הופתעו ממש, אמרו שהיה טעים, טרי ויפה. וכל הכבוד לך על היסודיות, הבירור המעמיק והאכפתיות. באמת שירות מדהים! תודה רבה",
  "יעל יקרה, רגע לפני שבת רציתי להודות לך שוב על ארוחת הבוקר המפנקת שהכנת עבורנו השבוע. כולן כל כך נהנו. היה מאוד טעים וההגשה כל כך אסתטית ומושקעת. מעריכה מאוד.",
  "מושקע! מהמם! אסתטי! אלופה, ממש תודה רבה! ועוד לחשוב שאתמול סגרתי איתך והיום זה כבר מתוקתק! אין עליך!",
  "המגשים שלך פיארו לנו את שבת בר המצווה! אין מילים! היה שפע פירות והם היו מעוצבים באופן שחבל לאכול ולהרוס, ועדיין נשאר ונהנים מזה. יבורכו ידייך! אפילו שלא אזורית, מתמידה להזמין ממך. רמה אחרת",
  "יעל יקרה, היה פשוט מושלם! עוגת החתן והכלה היתה פשוט מדהימה, והקינוחים טעימים, טריים ומגרים! כולם נהנו וליקקו את האצבעות! את אלופה! תודה",
  "הזמנתי מיעל משלוח של מגש פירות. המגש היה ממש יצירת אומנות יפה ומרשימה. ביקשתי שיגיע ביום שישי בבוקר, ועל אף שזה מורכב היא עשתה זאת. השירות שלה ברמה גבוהה מאוד, בע״ה אזמין ממנה שוב.",
  "It was amazing and tasty and so beautifully presented and we had enough for shabbat. Thank you so so much, shavua tov",
  "ושוב היה מושלם! נדיר שיש סדנה וכולן מרוצות, וזה מה שהיה. פשוט אושר גדול. תודה",
  "תודה לך יעל על סדנה ממש כיפית, מקצועית ומעניינת. למדתי הרבה על חיתוך פירות. הסברת את כל האפשרויות והטכניקות בצורה ברורה, מקצועית וקלה לביצוע. בפעם הראשונה שהייתי בסדנה של חיתוך פירות הגעתי לתוצאה מאוד יפה ומרשימה.",
  "יעל יקרה ואהובה, אין לי מילים להודות לך על מארז מושקע, יפהפה, אסתטי, מכובד ומרשים. התקשרתי אלייך רק הבוקר וחשבתי שזה ממש ברגע האחרון, אבל את כרגיל נענית במאור פנים לבקשתי. רציתי לשמח חברה גננת לפתיחת שנת הלימודים. תמיד זמינה, מפנקת מעל ומעבר, והכל בשמחה ובטוב לבב. מעריכה מאוד",
  "יעל יקרה ואהובה, המון תודה על מארז מושקע, אסתטי, טעים ומפנק. הכל היה ארוז בקפידה, עם תשומת לב מיוחדת לפרטים הקטנים. נהנינו כל כך מהאוכל המעולה, והכי חשוב: הכל היה טרי וטעים מאוד. מעריכים מאוד את ההשקעה. תודה על הפינוק השווה",
  "פעם ראשונה הזמנתי. הכל היה מיוחד מאוד, והאכפתיות שלך כאילו זו ההזמנה היחידה בערב החג, למרות שהבנתי את העומס. הכל היה כל כך אישי ומפנק. תודה ענקית",
  "שלום יעל! רציתי להגיד תודה רבה על הסדנה! היה לנו ממש כיף, החכמנו ולמדנו דברים חדשים. ההסברים היו קצרים, קולעים ומובנים, שאפילו אני, שחששתי בהתחלה, הבנתי איך לעשות ויצאתי עם כלים חדשים. והכל באווירה נעימה וזורמת. בקיצור, סדנה שבדיוק קלעה למטרה! המון תודה, ומאחלת לך ברכה והצלחה במעשי ידייך!",
  "יעל יקרה, רציתי להודות לך על מגש הפירות המדהים שהכנת לנו בהתראה כל כך קצרה. הצלחת לשמח את הבן שלי ואת כל לשכת פיקוד דרום!",
];

const EN = [
  "Hi Yael, I just wanted to say a huge thank you for the cake! It was gorgeous, beautifully decorated and, most importantly, incredibly tasty. Not a crumb was left. Thank you so much for everything!",
  "Thank you so much for the lovely delivery. The recipients were truly surprised and said it was tasty, fresh and beautiful. Well done on your thoroughness and care. Truly amazing service! Thank you",
  "Dear Yael, just before Shabbat I wanted to thank you again for the lovely breakfast you made for us this week. Everyone enjoyed it so much. It was delicious and so beautifully presented. Much appreciated.",
  "So much care! Stunning! Beautiful! You're a star, thank you so much! And to think I only ordered yesterday and today it's all done! You're the best!",
  "Your trays made our bar mitzvah Shabbat! No words! Plenty of fruit, arranged so beautifully it was a shame to eat it, and there was still some left to enjoy. Bless your hands! Even though I'm not local, I keep ordering from you. Another level",
  "Dear Yael, it was simply perfect! The wedding cake was amazing, and the desserts were tasty, fresh and tempting! Everyone loved it and licked their fingers! You're a star! Thank you",
  "I ordered a fruit tray delivery from Yael. The tray was a real work of art, beautiful and impressive. I asked for it to arrive on Friday morning, and even though that's hard, she did it. Her service is excellent, and I'll order from her again.",
  "It was amazing and tasty and so beautifully presented and we had enough for shabbat. Thank you so so much, shavua tov",
  "Perfect once again! It's rare for everyone to be happy with a workshop, and that's what happened. Pure joy. Thank you",
  "Thank you Yael for a really fun, professional and interesting workshop. I learned a lot about cutting fruit. You explained every option and technique clearly and made it easy to do. At my first fruit-cutting workshop I got a really beautiful result.",
  "Dear Yael, I have no words to thank you for such a beautiful, elegant and impressive gift box. I only called you this morning and thought it was too last-minute, but as always you said yes with a smile. I wanted to treat a kindergarten-teacher friend for the new school year. Always available, going above and beyond, and always happily. Much appreciated",
  "Dear Yael, thank you so much for a beautiful, tasty and generous box. Everything was packed with care and attention to the small details. We loved the excellent food, and most importantly, everything was very fresh and delicious. We really appreciate the effort. Thank you for the treat",
  "My first order. Everything was so special, and you cared as if it were your only order on the eve of the holiday, even though I knew how busy you were. It all felt so personal and generous. Huge thanks",
  "Hi Yael! I wanted to say thank you so much for the workshop! We had so much fun and learned new things. The explanations were short, clear and to the point, so even I, who was nervous at first, understood what to do and left with new skills. And all in such a pleasant, relaxed atmosphere. In short, a workshop that hit the mark! Thank you, and wishing you continued success!",
  "Dear Yael, I wanted to thank you for the amazing fruit tray you made for us at such short notice. You made my son and the whole Southern Command office happy!",
];

/** WhatsApp messages from Yael's customers (her Drive folder "לקוחות מפרגנים"). The same screenshots on both
 * sites; `alt` is the message itself, in English for the English site. */
const shots = (alts: string[]): Testimonial[] => alts.map((alt, i) => ({ image: { ...SIZES[i], src: `/testimonials/t${String(i + 1).padStart(2, "0")}.webp`, alt } }));

export const testimonials: Record<"he" | "en", Testimonial[]> = {
  he: shots(HE),
  en: shots(EN),
};
