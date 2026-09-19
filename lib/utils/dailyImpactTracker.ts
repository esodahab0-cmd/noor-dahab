/**
 * Daily Impact Tracker & Encouragement Engine
 * 
 * لوحة الإنجاز الشخصي والتتبع اليومي لتطبيق "نور دهب"
 * تسجل إحصائيات المساعدة اليومية وتولد تقريراً صوتياً محفزاً للكفيف.
 */

export interface DailyImpactStats {
  date: string;
  textsRead: number;
  currencyChecked: number;
  obstaclesNavigated: number;
  locationsAnnounced: number;
  totalInteractions: number;
}

const STORAGE_KEY = "noor_daily_impact_stats";

/**
 * تسجيل نشاط جديد في إنجازات اليوم
 */
export function recordDailyActivity(type: "text" | "currency" | "obstacle" | "location") {
  if (typeof window === "undefined") return;

  const today = new Date().toISOString().split("T")[0];
  let stats: DailyImpactStats = {
    date: today,
    textsRead: 0,
    currencyChecked: 0,
    obstaclesNavigated: 0,
    locationsAnnounced: 0,
    totalInteractions: 0,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) stats = parsed;
    }
  } catch {}

  if (type === "text") stats.textsRead += 1;
  else if (type === "currency") stats.currencyChecked += 1;
  else if (type === "obstacle") stats.obstaclesNavigated += 1;
  else if (type === "location") stats.locationsAnnounced += 1;
  stats.totalInteractions += 1;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * توليد تقرير الإنجاز الصوتي بلهجة مصرية مشجعة
 */
export function generateDailyImpactSpokenReport(): string {
  if (typeof window === "undefined") return "أنت بطل، ويومك كان مليان إنجازات جميلة مع نور دهب!";

  const today = new Date().toISOString().split("T")[0];
  let stats: DailyImpactStats = {
    date: today,
    textsRead: 0,
    currencyChecked: 0,
    obstaclesNavigated: 0,
    locationsAnnounced: 0,
    totalInteractions: 0,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) stats = parsed;
    }
  } catch {}

  if (stats.totalInteractions === 0) {
    return "لسه بادئين اليوم مع بعض! أنا جاهز أساعدك في أي وقت لقراءة الأوراق أو فحص الفلوس أو استكشاف الطريق.";
  }

  const parts: string[] = [];
  if (stats.textsRead > 0) parts.push(`قرينا مع بعض ${stats.textsRead} مستندات وأوراق`);
  if (stats.currencyChecked > 0) parts.push(`فحصنا وعدينا ${stats.currencyChecked} مبالغ نقدية`);
  if (stats.obstaclesNavigated > 0) parts.push(`نبهتك لـ ${stats.obstaclesNavigated} عوائق ومخاطر في طريقك`);
  if (stats.locationsAnnounced > 0) parts.push(`عرفتك معالم وأسماء الشوارع ${stats.locationsAnnounced} مرات`);

  const summary = parts.join("، و");
  return `عاش يا بطل! النهاردة ${summary}، بإجمالي ${stats.totalInteractions} مساعدة. فخور جداً إني ماشي جنبك خطوة بخطوة!`;
}
