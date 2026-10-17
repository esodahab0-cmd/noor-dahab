/**
 * Smart Tactile & Haptic Engine (محرك الاهتزازات التكتيكية الذكية)
 * Noor Dahab - Dahab Software
 * 
 * Provides distinct physical vibration patterns for blind users to sense:
 * 1. Safe clear pathways vs obstacles
 * 2. Left vs Right directional steering
 * 3. Emergency & danger alerts
 * 
 * 100% On-Device & Zero Latency.
 */

export const HAPTIC_PATTERNS = {
  // إشارة الطريق السالك والآمن (نبضة خفيفة ناعمة 40ms)
  CLEAR_PATH: [45],

  // تحذير من عائق يقترب (نبضتان متتاليتان)
  OBSTACLE_APPROACHING: [80, 70, 80],

  // خطر داهم أو حفرة أو سيارة (3 نبضات قوية متسارعة)
  CRITICAL_DANGER: [220, 50, 220, 50, 320],

  // توجيه لليسار (نبضة قصيرة تليها نبضة طويلة)
  STEER_LEFT: [40, 60, 150],

  // توجيه لليمين (نبضة طويلة تليها نبضة قصيرة)
  STEER_RIGHT: [150, 60, 40],

  // تأكيد نجاح أمر أو التقاط
  CONFIRMATION: [35, 40, 60],

  // نبضات نداء الطوارئ SOS (كود موريس ثلاث نبضات قصيرة ثم طويلة)
  SOS_PULSE: [100, 50, 100, 50, 100, 150, 250, 100, 250, 100, 250, 150, 100, 50, 100],
};

export function isHapticsSupported(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function vibratePattern(pattern: number | number[]): boolean {
  if (!isHapticsSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Triggers distinct tactile feedback based on analyzed text
 */
export function triggerHapticFromText(text: string): void {
  if (!text || !isHapticsSupported()) return;

  const clean = text.toLowerCase();

  // 1. Danger first
  if (/خطر|احذر|حاسب|انتبه|حفرة|بلاعة|عربية|سيارة|موتوسيكل|سلم نازل|سقوط|قف|أقف|اقف/.test(clean)) {
    vibratePattern(HAPTIC_PATTERNS.CRITICAL_DANGER);
    return;
  }

  // 2. Directional Steering
  const rightRegex = /يمينك|على اليمين|عاليمين|ناحية اليمين|انحرف يمين|حود يمين|كسر يمين/;
  const leftRegex = /شمالك|على الشمال|عالشمال|يسارك|على اليسار|ناحية الشمال|ناحية اليسار|انحرف شمال|حود شمال|كسر شمال/;

  if (rightRegex.test(clean) && !leftRegex.test(clean)) {
    vibratePattern(HAPTIC_PATTERNS.STEER_RIGHT);
    return;
  }

  if (leftRegex.test(clean) && !rightRegex.test(clean)) {
    vibratePattern(HAPTIC_PATTERNS.STEER_LEFT);
    return;
  }

  // 3. General Obstacle warning
  if (/عائق|عمود|شجرة|كرسي|ترابيزة|صندوق|رصيف|حائط|جدار|انحرف|تفادى|حاجة قدامك/.test(clean)) {
    vibratePattern(HAPTIC_PATTERNS.OBSTACLE_APPROACHING);
    return;
  }

  // 4. Clear safe path
  if (/سالك|فاضي|طريقك سالك|طريقك مفتوح|أمان|طمن|طريق سالك|فاضية|تمام كمل|مفيش عوائق|امشي بأمان/.test(clean)) {
    vibratePattern(HAPTIC_PATTERNS.CLEAR_PATH);
    return;
  }
}
