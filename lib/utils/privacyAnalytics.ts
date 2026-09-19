/**
 * Local Privacy-First Analytics & Performance Tracker
 * 
 * نظام تحليل الأداء ومراقبة الخصوصية المحلي لتطبيق "نور دهب"
 * 100% On-Device - لا يتم إرسال أي بايت أو صورة أو بيانات شخصية لخوادم طرف ثالث.
 */

export interface LatencyLog {
  timestamp: number;
  mode: string;
  provider: string;
  latencyMs: number;
  success: boolean;
  isOffline: boolean;
}

const ANALYTICS_STORAGE_KEY = "noor_local_privacy_logs";
const MAX_LOGS = 100; // الاحتفاظ بآخر 100 عملية فحص فقط

/**
 * تسجيل زمن وأداء العملية محلياً
 */
export function recordLocalMetric(
  mode: string,
  provider: string,
  latencyMs: number,
  success: boolean,
  isOffline: boolean = false
) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const logs: LatencyLog[] = raw ? JSON.parse(raw) : [];

    const newLog: LatencyLog = {
      timestamp: Date.now(),
      mode,
      provider,
      latencyMs,
      success,
      isOffline,
    };

    logs.unshift(newLog);
    if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;

    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn("Could not record local metric:", e);
  }
}

/**
 * حساب متوسط زمن الاستجابة ونسبة النجاح محلياً
 */
export function getLocalPerformanceSummary(): {
  averageLatencyMs: number;
  successRate: number;
  totalRequests: number;
} {
  if (typeof window === "undefined") {
    return { averageLatencyMs: 0, successRate: 100, totalRequests: 0 };
  }

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return { averageLatencyMs: 0, successRate: 100, totalRequests: 0 };

    const logs: LatencyLog[] = JSON.parse(raw);
    if (logs.length === 0) return { averageLatencyMs: 0, successRate: 100, totalRequests: 0 };

    const totalLatency = logs.reduce((acc, l) => acc + l.latencyMs, 0);
    const successfulCount = logs.filter((l) => l.success).length;

    return {
      averageLatencyMs: Math.round(totalLatency / logs.length),
      successRate: Math.round((successfulCount / logs.length) * 100),
      totalRequests: logs.length,
    };
  } catch {
    return { averageLatencyMs: 0, successRate: 100, totalRequests: 0 };
  }
}
