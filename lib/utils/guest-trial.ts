/**
 * Noor Dahab - Guest Trial Architecture
 * Grants unauthenticated / guest users 5 free cloud AI vision analyses per day.
 * Offline features (Radar, Metro, Compass, Barcode, Local Detection) remain 100% unlimited.
 */

const GUEST_TRIAL_KEY = "noor_guest_trial_record";
export const GUEST_DAILY_LIMIT = 5;

interface GuestTrialData {
  date: string; // YYYY-MM-DD
  usedCount: number;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getGuestTrialStatus(): {
  isGuest: boolean;
  usedCount: number;
  remaining: number;
  hasRemaining: boolean;
  limit: number;
} {
  if (typeof window === "undefined") {
    return { isGuest: false, usedCount: 0, remaining: GUEST_DAILY_LIMIT, hasRemaining: true, limit: GUEST_DAILY_LIMIT };
  }

  const rawUser = localStorage.getItem("noor_user");
  const isGuest = !rawUser || JSON.parse(rawUser || "{}").isGuest === true;

  if (!isGuest) {
    return { isGuest: false, usedCount: 0, remaining: 9999, hasRemaining: true, limit: 9999 };
  }

  const today = getTodayString();
  let data: GuestTrialData = { date: today, usedCount: 0 };

  try {
    const rawData = localStorage.getItem(GUEST_TRIAL_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed.date === today) {
        data = parsed;
      } else {
        // Reset count for new day
        data = { date: today, usedCount: 0 };
        localStorage.setItem(GUEST_TRIAL_KEY, JSON.stringify(data));
      }
    }
  } catch {
    data = { date: today, usedCount: 0 };
  }

  const remaining = Math.max(0, GUEST_DAILY_LIMIT - data.usedCount);
  return {
    isGuest: true,
    usedCount: data.usedCount,
    remaining,
    hasRemaining: remaining > 0,
    limit: GUEST_DAILY_LIMIT
  };
}

export function consumeGuestTrialAttempt(): {
  success: boolean;
  remaining: number;
  message?: string;
} {
  if (typeof window === "undefined") {
    return { success: true, remaining: GUEST_DAILY_LIMIT };
  }

  const status = getGuestTrialStatus();
  if (!status.isGuest) {
    return { success: true, remaining: 9999 };
  }

  if (!status.hasRemaining) {
    return {
      success: false,
      remaining: 0,
      message: "استنفدت حد التجربة اليومي المجاني، تواصل مع إدارة دهب سوفت وير للحصول على حسابك الكامل."
    };
  }

  const today = getTodayString();
  const nextCount = status.usedCount + 1;
  const nextData: GuestTrialData = { date: today, usedCount: nextCount };

  try {
    localStorage.setItem(GUEST_TRIAL_KEY, JSON.stringify(nextData));
  } catch {}

  const remaining = Math.max(0, GUEST_DAILY_LIMIT - nextCount);
  return {
    success: true,
    remaining,
  };
}

export const GUEST_EXHAUSTED_MESSAGE =
  "استنفدت حد التجربة اليومي المجاني، تواصل مع إدراة دهب سوفت وير للحصول على حسابك الكامل.";
