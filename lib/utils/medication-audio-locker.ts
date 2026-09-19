/**
 * Medication Audio Locker & Personalized Voice Labeling System
 * 
 * خزانة الأدوية والوسوم الصوتية الشخصية لتطبيق "نور دهب"
 * 
 * تتيح للمستخدم الكفيف:
 * 1. تسجيل اسم أو جرعة الدواء والمنتجات بصوته أو باسم مخصص.
 * 2. ربط التسجيل بباركود العلبة أو اسمها المميز.
 * 3. عند توجيه الكاميرا نحو المنتج، ينطق التطبيق فوراً التسجيل الشخصي للمستخدم أوفلاين.
 */

export interface MedicationAudioTag {
  id: string;
  codeOrKey: string; // الباركود أو الكلمة المميزة
  title: string;
  voiceNote?: string; // النص التوضيحي للجرعة أو الاستخدام
  audioBase64?: string; // تسجيل صوتي مباشر إذا وجد
  createdAt: number;
}

const STORAGE_KEY = "noor_medication_tags";

/**
 * جلب جميع الوسوم الصوتية المحفوظة محلياً
 */
export function getAllMedicationTags(): MedicationAudioTag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * حفظ وسم صوتي جديد لدواء أو منتج
 */
export function saveMedicationTag(tag: Omit<MedicationAudioTag, "id" | "createdAt">): MedicationAudioTag {
  const existing = getAllMedicationTags();
  const newTag: MedicationAudioTag = {
    ...tag,
    id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
  };

  // تحديث إذا كان نفس الكود موجوداً أو إضافة جديد
  const filtered = existing.filter(
    (t) => t.codeOrKey.toLowerCase().trim() !== tag.codeOrKey.toLowerCase().trim()
  );
  filtered.unshift(newTag);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Could not save medication tag to localStorage:", e);
  }

  return newTag;
}

/**
 * البحث السريع عن وسم صوتي مسجل بواسطة الباركود أو النص
 */
export function findMatchingMedicationTag(query: string): MedicationAudioTag | null {
  if (!query || !query.trim()) return null;
  const cleanQuery = query.toLowerCase().trim();
  const tags = getAllMedicationTags();

  // 1. تطابق كامل مع الكود/الباركود
  const exactCode = tags.find((t) => t.codeOrKey.toLowerCase().trim() === cleanQuery);
  if (exactCode) return exactCode;

  // 2. تطابق جزئي مع عنوان الدواء أو الكود
  const partial = tags.find(
    (t) =>
      cleanQuery.includes(t.codeOrKey.toLowerCase().trim()) ||
      cleanQuery.includes(t.title.toLowerCase().trim()) ||
      t.title.toLowerCase().trim().includes(cleanQuery)
  );

  return partial || null;
}

/**
 * حذف وسم دواء
 */
export function deleteMedicationTag(id: string): boolean {
  try {
    const existing = getAllMedicationTags();
    const updated = existing.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}
