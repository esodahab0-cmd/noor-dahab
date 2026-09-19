/**
 * Proactive Context Awareness Engine
 * 
 * محرك الوعي السياقي الاستباقي لتطبيق "نور دهب"
 * يقترح أو يفعل النمط الأنسب تلقائياً بناءً على:
 * 1. الوقت من اليوم (صباحاً، ظهراً، مساءً).
 * 2. طبيعة المكان (شارع، مسجد، متجر، منزل).
 */

import { AnalysisMode } from "./types";

export interface ContextRecommendation {
  recommendedMode: AnalysisMode;
  reason: string;
  shouldMuteAudio: boolean; // إسكات الصوت تلقائياً في المساجد أو الأماكن الهادئة
}

/**
 * تقييم السياق التلقائي واقتراح الوضع الأنسب للكفيف
 */
export function evaluateProactiveContext(locationText?: string): ContextRecommendation {
  const currentHour = new Date().getHours();
  const lowerLoc = (locationText || "").toLowerCase();

  // 1. فحص الأماكن المقدسة والمساجد (إسكات آلي واحترام للمكان)
  if (/مسجد|جامع|كنيسة|صلاة|مصلية/.test(lowerLoc)) {
    return {
      recommendedMode: "general",
      reason: "تم رصد تواجدك في دار عبادة، تم تخفيف الصوت تلقائياً احتراماً للمكان.",
      shouldMuteAudio: true,
    };
  }

  // 2. فترة الصباح الباكر ومواعيد العمل (6 ص - 9 ص) في الشارع -> مواصلات ومترو
  if (currentHour >= 6 && currentHour <= 10) {
    return {
      recommendedMode: "transit",
      reason: "صباح الخير! تم تجهيز وضع المواصلات والمترو تلقائياً لتسهيل طريقك.",
      shouldMuteAudio: false,
    };
  }

  // 3. فترة المساء المتأخرة والليل (بعد 10 مساءً) -> كاشف الإضاءة وتفادي العوائق
  if (currentHour >= 22 || currentHour <= 5) {
    return {
      recommendedMode: "obstacle",
      reason: "تم تجهيز وضع رصد العوائق ليلاً مع مراعاة الإضاءة.",
      shouldMuteAudio: false,
    };
  }

  // الوضع العام كخيار أساسي ذكي
  return {
    recommendedMode: "general",
    reason: "الوضع العام جاهز لمساعدتك.",
    shouldMuteAudio: false,
  };
}
