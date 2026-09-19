/**
 * Incremental Learning & Local Overrides Engine
 * 
 * نظام التعلم التدريجي والتخصيص المحلي لتطبيق "نور دهب"
 * يتيح للكفيف تعليم التطبيق أسماء وتفضيلات أغراضه وأدويته الشخصية
 * ليتعرف عليها فوراً بالاسم المفضل لديه أوفلاين.
 */

export interface CustomObjectOverride {
  id: string;
  originalTerm: string; // الكلمة أو الاسم الذي يتعرف عليه الـ AI
  customLabel: string;  // الاسم المفضل للكفيف (مثلاً: "قميصي الكحلي بتاع الجمعة")
  category: "clothing" | "medication" | "item" | "place";
  updatedAt: number;
}

const STORAGE_KEY = "noor_local_learning_overrides";

/**
 * جلب جميع المسميات المخصصة
 */
export function getAllLocalOverrides(): CustomObjectOverride[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * حفظ أو تحديث مسمى مخصص
 */
export function saveLocalOverride(
  originalTerm: string,
  customLabel: string,
  category: CustomObjectOverride["category"] = "item"
): CustomObjectOverride {
  const existing = getAllLocalOverrides();
  const filtered = existing.filter(
    (o) => o.originalTerm.toLowerCase().trim() !== originalTerm.toLowerCase().trim()
  );

  const newOverride: CustomObjectOverride = {
    id: `ovr_${Date.now()}`,
    originalTerm: originalTerm.trim(),
    customLabel: customLabel.trim(),
    category,
    updatedAt: Date.now(),
  };

  filtered.unshift(newOverride);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}

  return newOverride;
}

/**
 * تطبيق التخصيصات والتعلم المحلي على النص الناتج من الذكاء الاصطناعي
 */
export function applyLocalOverridesToText(aiText: string): string {
  if (!aiText) return aiText;
  const overrides = getAllLocalOverrides();
  let result = aiText;

  for (const override of overrides) {
    if (result.includes(override.originalTerm)) {
      result = result.replaceAll(override.originalTerm, override.customLabel);
    }
  }

  return result;
}
