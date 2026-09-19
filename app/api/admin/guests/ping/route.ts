import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders, handleCorsPreflight } from "@/lib/security/cors";

interface ActiveGuestSession {
  guestId: string;
  userAgent?: string;
  ipHash?: string;
  connectedAt: number;
  lastPingAt: number;
}

// In-memory store for active guests (Cleaned up periodically)
const activeGuestsMap = new Map<string, ActiveGuestSession>();
const GUEST_TIMEOUT_MS = 60 * 1000; // 60 seconds inactivity = offline

function cleanupInactiveGuests() {
  const now = Date.now();
  const entries = Array.from(activeGuestsMap.entries());
  for (const [id, session] of entries) {
    if (now - session.lastPingAt > GUEST_TIMEOUT_MS) {
      activeGuestsMap.delete(id);
    }
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

/**
 * POST: Guest Heartbeat Ping
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body = await request.json().catch(() => ({}));
    const guestId = body.guestId || "unknown_guest";
    const userAgent = request.headers.get("user-agent") || "Unknown Device";
    
    // Anonymized IP hash
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = ip.split(".").slice(0, 3).join(".") + ".*";

    cleanupInactiveGuests();

    const existing = activeGuestsMap.get(guestId);
    activeGuestsMap.set(guestId, {
      guestId,
      userAgent,
      ipHash,
      connectedAt: existing ? existing.connectedAt : Date.now(),
      lastPingAt: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        onlineGuestsCount: activeGuestsMap.size,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * GET: Retrieve Live Online Guests for Admin Dashboard
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    cleanupInactiveGuests();

    const guests = Array.from(activeGuestsMap.values()).map((g) => ({
      ...g,
      idleSeconds: Math.round((Date.now() - g.lastPingAt) / 1000),
      durationMinutes: Math.round((Date.now() - g.connectedAt) / 60000),
    }));

    // Sort by most recently active
    guests.sort((a, b) => b.lastPingAt - a.lastPingAt);

    return NextResponse.json(
      {
        success: true,
        onlineCount: guests.length,
        guests,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
