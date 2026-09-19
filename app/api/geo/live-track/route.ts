import { NextRequest, NextResponse } from "next/server";

interface LiveTrackPoint {
  token: string;
  lat: number;
  lon: number;
  locationName?: string;
  speed?: number;
  battery?: number;
  heading?: string;
  updatedAt: number;
  createdAt: number;
}

// In-memory store for active live tracking sessions (1 hour TTL)
const activeSessions = new Map<string, LiveTrackPoint>();
const SESSION_TTL_MS = 60 * 60 * 1000; // 60 minutes

function cleanupExpiredSessions() {
  const now = Date.now();
  const entries = Array.from(activeSessions.entries());
  for (const [token, session] of entries) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      activeSessions.delete(token);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, lat, lon, locationName, speed, battery, heading } = body;

    if (!token || typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "Missing token or coordinates" }, { status: 400 });
    }

    cleanupExpiredSessions();

    const existing = activeSessions.get(token);
    const createdAt = existing ? existing.createdAt : Date.now();

    activeSessions.set(token, {
      token,
      lat,
      lon,
      locationName: locationName || existing?.locationName || "موقع محدد عبر الـ GPS",
      speed: speed ?? existing?.speed,
      battery: battery ?? existing?.battery,
      heading: heading || existing?.heading,
      updatedAt: Date.now(),
      createdAt,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresInMinutes: Math.max(0, Math.round((createdAt + SESSION_TTL_MS - Date.now()) / 60000)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update tracking" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  cleanupExpiredSessions();

  const session = activeSessions.get(token);
  if (!session) {
    return NextResponse.json({
      success: false,
      active: false,
      message: "جلسة التتبع غير موجودة أو انتهت صلاحيتها (مدة الصلاحية ساعة واحدة من بدء الاستغاثة).",
    }, { status: 404 });
  }

  const ageSeconds = Math.round((Date.now() - session.updatedAt) / 1000);

  return NextResponse.json({
    success: true,
    active: true,
    session: {
      ...session,
      ageSeconds,
      isLive: ageSeconds < 45, // considered live if updated in last 45s
    },
  });
}
