import { NextRequest, NextResponse } from "next/server";
import { processVisionWithFallback, buildSystemPrompt } from "@/lib/ai/fallback-engine";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AIKeysConfig } from "@/lib/ai/types";
import { validateOrigin, getCorsHeaders, handleCorsPreflight } from "@/lib/security/cors";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // 1. Strict Origin Validation (Domain Locking)
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "طلب غير مصرح به: النطاق غير معتمد." },
      { status: 403, headers: corsHeaders }
    );
  }

  // 2. Sliding-Window Rate Limiting (20 requests / minute / IP)
  const rateLimit = checkRateLimit(request, 20, 60 * 1000);
  const rateLimitHeaders = {
    ...corsHeaders,
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetSeconds),
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        text: `عذراً، لقد تجاوزت الحد الأقصى للطلبات المتتالية. يرجى الانتظار ${rateLimit.resetSeconds} ثانية للحفاظ على استقرار الخدمة.`,
        error: "Rate limit exceeded"
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const sessionToken = request.headers.get("x-session-token");
    const username = request.headers.get("x-username");

    if (username && username !== "admin") {
      try {
        const userRef = doc(db, "users", username);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          if (u.activeSessionToken && u.activeSessionToken !== sessionToken) {
            return NextResponse.json(
              { error: "تم فتح حسابك من جهاز آخر. تم تسجيل الخروج لسلامتك." },
              { status: 403, headers: rateLimitHeaders }
            );
          }
        }
      } catch (e) {
        console.warn("Session check fallback:", e);
      }
    }

    const body = await request.json();
    const { imageBase64, mode = "general", locationInfo, registeredFaces, userQuestion } = body;

    if (!imageBase64 && mode !== "chat") {
      return NextResponse.json(
        { error: "الصورة مطلوبة للتحليل البصري." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    let keysConfig: AIKeysConfig = {};
    try {
      const snap = await getDoc(doc(db, "config", "ai_keys"));
      if (snap.exists()) keysConfig = snap.data() as AIKeysConfig;
    } catch {}

    const prompt = buildSystemPrompt(mode, locationInfo, registeredFaces, userQuestion);
    const result = await processVisionWithFallback(
      { imageBase64, mode, locationInfo, customPrompt: prompt, userQuestion },
      keysConfig
    );

    return NextResponse.json(result, { headers: rateLimitHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, text: "حدث خطأ غير متوقع.", error: error.message },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}