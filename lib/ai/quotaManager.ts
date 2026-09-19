/**
 * Dynamic AI Quota Manager & Provider Switcher
 * 
 * نظام إدارة الحصص والتوزيع الذكي لحركة المرور بين مزودي الذكاء الاصطناعي
 * لتطبيق "نور دهب" لضمان عدم انقطاع الخدمة مجاناً 100%.
 */

import { AIProvider } from "./types";

export interface QuotaStatus {
  dailyLimit: number;
  consumedToday: number;
  remainingToday: number;
  recommendedProvider: AIProvider;
  isThrottled: boolean;
}

const STORAGE_KEY = "noor_daily_quota_tracker";
const DEFAULT_DAILY_LIMIT = 500; // 500 طلب يومي مجاني لكل مستخدم

/**
 * فحص وتحديث الحصة اليومية للمستخدم
 */
export function checkAndUpdateQuota(): QuotaStatus {
  if (typeof window === "undefined") {
    return {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      consumedToday: 0,
      remainingToday: DEFAULT_DAILY_LIMIT,
      recommendedProvider: "gemini",
      isThrottled: false,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let storedData: { date: string; count: number } = { date: todayStr, count: 0 };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayStr) {
        storedData = parsed;
      }
    }
  } catch {}

  // زيادة العداد
  storedData.count += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  } catch {}

  const remaining = Math.max(0, DEFAULT_DAILY_LIMIT - storedData.count);
  const isThrottled = remaining === 0;

  // التبديل التلقائي الذكي بين المزودين بناءً على معدل الاستهلاك
  let recommendedProvider: AIProvider = "gemini";
  if (storedData.count > 250) {
    recommendedProvider = "groq"; // تحويل لجروك فائق السرعة لتوفير جيميني
  } else if (storedData.count > 400) {
    recommendedProvider = "cloudflare";
  }

  return {
    dailyLimit: DEFAULT_DAILY_LIMIT,
    consumedToday: storedData.count,
    remainingToday: remaining,
    recommendedProvider,
    isThrottled,
  };
}

/**
 * استعلام الحصة الحالية دون زيادتها
 */
export function getQuotaStatus(): QuotaStatus {
  if (typeof window === "undefined") {
    return {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      consumedToday: 0,
      remainingToday: DEFAULT_DAILY_LIMIT,
      recommendedProvider: "gemini",
      isThrottled: false,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let count = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayStr) count = parsed.count || 0;
    }
  } catch {}

  return {
    dailyLimit: DEFAULT_DAILY_LIMIT,
    consumedToday: count,
    remainingToday: Math.max(0, DEFAULT_DAILY_LIMIT - count),
    recommendedProvider: count > 250 ? "groq" : "gemini",
    isThrottled: count >= DEFAULT_DAILY_LIMIT,
  };
}
