/**
 * Resilient Circuit Breaker Engine for AI Providers
 * 
 * قاطع الدائرة الذاتي لمزودي الذكاء الاصطناعي لتطبيق "نور دهب"
 * يمنع الانتظار البطيء عند تعطل أي مزود (Gemini, Groq, Cloudflare, HuggingFace)
 * ويوجه الطلب للمزود التالي في أجزاء من الثانية (Zero-Latency Fallback).
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ProviderCircuitRecord {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  cooldownMs: number;
}

const FAILURE_THRESHOLD = 2; // عدد مرات الفشل قبل فتح الدائرة وقفل المزود مؤقتاً
const COOLDOWN_PERIOD_MS = 60 * 1000; // مدة التوقف المؤقت (60 ثانية) قبل التجربة

// سجل حالات المزودين في الذاكرة
const circuitMap = new Map<string, ProviderCircuitRecord>();

function getOrCreateCircuit(provider: string): ProviderCircuitRecord {
  let record = circuitMap.get(provider);
  if (!record) {
    record = {
      state: "CLOSED",
      failureCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: Date.now(),
      cooldownMs: COOLDOWN_PERIOD_MS,
    };
    circuitMap.set(provider, record);
  }
  return record;
}

/**
 * فحص ما إذا كان المزود متاحاً ومسموحاً بالاتصال به
 */
export function canExecuteProvider(provider: string): boolean {
  const circuit = getOrCreateCircuit(provider);
  const now = Date.now();

  if (circuit.state === "CLOSED") {
    return true;
  }

  if (circuit.state === "OPEN") {
    // إذا انتهت فترة التهدئة ندخل في نصف-مفتوح لتجربة فحص صحي
    if (now - circuit.lastFailureTime > circuit.cooldownMs) {
      circuit.state = "HALF_OPEN";
      return true;
    }
    return false; // تخطي المزود فوراً
  }

  if (circuit.state === "HALF_OPEN") {
    // في حالة التجربة نسمح بطلب واحد فقط
    return true;
  }

  return true;
}

/**
 * تسجيل نجاح استدعاء المزود (إغلاق الدائرة وإعادة التصفير)
 */
export function recordProviderSuccess(provider: string) {
  const circuit = getOrCreateCircuit(provider);
  circuit.state = "CLOSED";
  circuit.failureCount = 0;
  circuit.lastSuccessTime = Date.now();
}

/**
 * تسجيل فشل استدعاء المزود (فتح الدائرة إذا تكرر الفشل)
 */
export function recordProviderFailure(provider: string, errorMessage?: string) {
  const circuit = getOrCreateCircuit(provider);
  circuit.failureCount += 1;
  circuit.lastFailureTime = Date.now();

  if (circuit.state === "HALF_OPEN" || circuit.failureCount >= FAILURE_THRESHOLD) {
    circuit.state = "OPEN";
    console.warn(
      `[CircuitBreaker] ⚠️ المزود "${provider}" دخل في حالة OPEN (توقف مؤقت 60 ثانية) بسبب: ${
        errorMessage || "تكرار الفشل"
      }`
    );
  }
}

/**
 * الحصول على تقرير صحة المزودين للوحة التحكم
 */
export function getProvidersHealthSummary(): Record<string, { state: CircuitState; healthy: boolean }> {
  const summary: Record<string, { state: CircuitState; healthy: boolean }> = {};
  const providers = ["gemini", "groq", "cloudflare", "huggingface"];

  providers.forEach((p) => {
    const c = getOrCreateCircuit(p);
    summary[p] = {
      state: c.state,
      healthy: c.state === "CLOSED",
    };
  });

  return summary;
}
