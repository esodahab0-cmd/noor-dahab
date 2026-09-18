import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

interface LoginAttemptRecord {
  failures: number;
  lockedUntil?: number;
}

// In-memory sliding-window store
const rateLimitStore = new Map<string, RateLimitRecord>();
const loginAttemptStore = new Map<string, LoginAttemptRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - 60000;
    rateLimitStore.forEach((record, ip) => {
      record.timestamps = record.timestamps.filter((t: number) => t > cutoff);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(ip);
      }
    });

    loginAttemptStore.forEach((record, ip) => {
      if (record.lockedUntil && record.lockedUntil < now) {
        loginAttemptStore.delete(ip);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Extracts client IP address accurately from standard reverse-proxy headers
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Sliding-window rate limiter per client IP
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests = 20,
  windowMs = 60 * 1000
): RateLimitResult {
  const ip = getClientIp(request);
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(ip, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t: number) => t > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    const resetSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  // Allow request and log timestamp
  record.timestamps.push(now);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Auth Brute-force Lockout Checker
 * 5 failed login attempts lock the IP for 15 minutes (900,000 ms)
 */
export function checkLoginLockout(request: NextRequest): {
  isLocked: boolean;
  minutesRemaining?: number;
} {
  const ip = getClientIp(request);
  const record = loginAttemptStore.get(ip);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const minutesRemaining = Math.max(1, Math.ceil((record.lockedUntil - now) / (60 * 1000)));
    return { isLocked: true, minutesRemaining };
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    loginAttemptStore.delete(ip);
    return { isLocked: false };
  }

  return { isLocked: false };
}

/**
 * Records a failed login attempt; locks for 15 minutes on 5th failure
 */
export function recordLoginFailure(request: NextRequest): {
  isNowLocked: boolean;
  failures: number;
} {
  const ip = getClientIp(request);
  const now = Date.now();
  let record = loginAttemptStore.get(ip);

  if (!record) {
    record = { failures: 1 };
    loginAttemptStore.set(ip, record);
    return { isNowLocked: false, failures: 1 };
  }

  record.failures += 1;
  if (record.failures >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    return { isNowLocked: true, failures: record.failures };
  }

  return { isNowLocked: false, failures: record.failures };
}

/**
 * Clears failed attempts upon successful login
 */
export function resetLoginFailures(request: NextRequest): void {
  const ip = getClientIp(request);
  loginAttemptStore.delete(ip);
}
