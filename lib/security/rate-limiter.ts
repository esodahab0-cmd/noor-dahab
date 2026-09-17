import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding-window store
const rateLimitStore = new Map<string, RateLimitRecord>();

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
 * @param request NextRequest
 * @param maxRequests Maximum requests allowed in the window (default: 20)
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 min)
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
