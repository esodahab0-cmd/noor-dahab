import { NextRequest, NextResponse } from "next/server";

// Allowed production and development origins
const ALLOWED_ORIGINS = new Set([
  "https://dahabsoftware.online",
  "https://www.dahabsoftware.online",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

/**
 * Validates whether the incoming request is from a legitimate, authorized origin.
 * Blocks malicious third-party websites, external callers, and unauthorized scripts.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // 1. Direct origin match
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) return true;
    // Allow vercel preview deployments
    if (origin.endsWith(".vercel.app") && origin.includes("noor-dahab")) return true;
    return false;
  }

  // 2. Referer match (e.g. for relative browser fetches)
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const refOrigin = refUrl.origin;
      if (ALLOWED_ORIGINS.has(refOrigin)) return true;
      if (refOrigin.endsWith(".vercel.app") && refOrigin.includes("noor-dahab")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // 3. Browser-internal same-origin fetch (when headers like origin/referer might be omitted)
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  // In development, allow local requests without origin (e.g. SSR or local test)
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

/**
 * Generates standard CORS headers for responses
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") || "https://dahabsoftware.online";
  const isAllowed = ALLOWED_ORIGINS.has(origin) || (origin.endsWith(".vercel.app") && origin.includes("noor-dahab"));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://dahabsoftware.online",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token, x-username, x-admin-secret",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handles CORS Preflight OPTIONS requests
 */
export function handleCorsPreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
