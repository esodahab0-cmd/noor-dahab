"use client";

import { vibratePattern, HAPTIC_PATTERNS, triggerHapticFromText, isHapticsSupported } from "@/lib/haptics/smartHaptics";

export function useHaptic() {
  const triggerHaptic = (type: "light" | "medium" | "success" | "error" | "danger" | "clear" | "steer_left" | "steer_right") => {
    if (!isHapticsSupported()) return;

    const patterns: Record<string, number | number[]> = {
      light: HAPTIC_PATTERNS.CLEAR_PATH,
      medium: HAPTIC_PATTERNS.OBSTACLE_APPROACHING,
      success: HAPTIC_PATTERNS.CONFIRMATION,
      error: HAPTIC_PATTERNS.CRITICAL_DANGER,
      danger: HAPTIC_PATTERNS.CRITICAL_DANGER,
      clear: HAPTIC_PATTERNS.CLEAR_PATH,
      steer_left: HAPTIC_PATTERNS.STEER_LEFT,
      steer_right: HAPTIC_PATTERNS.STEER_RIGHT,
    };

    const pattern = patterns[type] || HAPTIC_PATTERNS.CLEAR_PATH;
    vibratePattern(pattern);
  };

  return {
    triggerHaptic,
    triggerHapticFromText,
    vibratePattern,
    HAPTIC_PATTERNS,
  };
}
