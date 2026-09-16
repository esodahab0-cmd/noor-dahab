import { NextRequest, NextResponse } from "next/server";
import { processVisionWithFallback, buildSystemPrompt } from "@/lib/ai/fallback-engine";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AIKeysConfig } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
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
              { status: 403 }
            );
          }
        }
      } catch (e) {
        console.warn("Session check fallback:", e);
      }
    }

    const body = await request.json();
    const { imageBase64, mode = "general", locationInfo, registeredFaces, userQuestion } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "الصورة مطلوبة للتحليل." }, { status: 400 });
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

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, text: "حدث خطأ غير متوقع.", error: error.message },
      { status: 500 }
    );
  }
}