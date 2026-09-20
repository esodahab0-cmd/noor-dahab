import { NextRequest, NextResponse } from "next/server";
import { getGeminiPoolCount } from "@/lib/ai/gemini-pool";
import { getCloudflareTokenCount } from "@/lib/ai/cloudflare-pool";
import { getOpenRouterPoolCount } from "@/lib/ai/openrouter";
import { validateOrigin } from "@/lib/security/cors";

export async function GET(request: NextRequest) {
  // 1. Origin verification
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
  }

  // 2. Return key counts & readiness status without ANY key strings
  try {
    const geminiCount = getGeminiPoolCount();
    const cloudflareCount = getCloudflareTokenCount();
    const openrouterCount = getOpenRouterPoolCount();

    return NextResponse.json({
      success: true,
      geminiCount,
      cloudflareCount,
      openrouterCount,
      hasGroqEnv: Boolean(process.env.GROQ_API_KEY),
      hasHfEnv: Boolean(process.env.HUGGINGFACE_API_KEY),
      timestamp: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
