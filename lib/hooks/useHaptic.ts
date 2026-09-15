"use client";
export function useHaptic() {
  const triggerHaptic = (type: "light" | "medium" | "success" | "error") => {
    if (typeof window === "undefined" || !navigator.vibrate) return;
    const patterns: Record<string, number | number[]> = {
      light: 40,
      medium: 80,
      success: [50, 50, 100],
      error: [150, 100, 150, 100, 200],
    };
    try { navigator.vibrate(patterns[type] as any); } catch {}
  };
  return { triggerHaptic };
}
