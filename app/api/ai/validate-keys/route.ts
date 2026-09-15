import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGroq } from "@/lib/ai/groq";
import { analyzeWithGeminiPool } from "@/lib/ai/gemini-pool";
import { analyzeWithCloudflarePool } from "@/lib/ai/cloudflare-pool";
import { analyzeWithHuggingFace } from "@/lib/ai/huggingface";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

async function getTestImageBase64(): Promise<string> {
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== (process.env.ADMIN_PASSWORD || "NoorDahab@2024")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let keys: any = {};
    try {
      const snap = await getDoc(doc(db, "config", "ai_keys"));
      if (snap.exists()) keys = snap.data();
    } catch {}

    const testImg = await getTestImageBase64();
    const testPrompt = "قل كلمة واحدة: ممتاز";
    const results: any = {};

    // 1. Test Gemini Pool
    try {
      const geminiResult = await analyzeWithGeminiPool(testImg, testPrompt, keys.geminiKey ? [keys.geminiKey] : undefined);
      results.gemini = { status: "ok", latencyMs: geminiResult.latencyMs, keyUsed: geminiResult.keyUsed };
    } catch (e: any) {
      results.gemini = { status: "error", message: e.message };
    }

    // 2. Test Groq
    const groqKey = keys.groqKey || process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const start = Date.now();
        await analyzeWithGroq(testImg, testPrompt, groqKey);
        results.groq = { status: "ok", latencyMs: Date.now() - start };
      } catch (e: any) { results.groq = { status: "error", message: e.message }; }
    } else { results.groq = { status: "no_key" }; }

    // 3. Test Cloudflare Pool
    const cfAccount = keys.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    if (cfAccount) {
      try {
        const customTokens = keys.cloudflareApiToken ? [keys.cloudflareApiToken] : undefined;
        const cfResult = await analyzeWithCloudflarePool(testImg, testPrompt, cfAccount, customTokens);
        results.cloudflare = { status: "ok", latencyMs: cfResult.latencyMs, tokenUsed: cfResult.tokenUsed };
      } catch (e: any) { results.cloudflare = { status: "error", message: e.message }; }
    } else {
      results.cloudflare = { status: "need_account_id", message: "المفتاحان نشطان! يلزم إدخال Account ID من حسابك لتفعيلهما." };
    }

    // 4. Test Hugging Face
    const hfKey = keys.huggingfaceKey || process.env.HUGGINGFACE_API_KEY;
    if (hfKey) {
      try {
        const start = Date.now();
        await analyzeWithHuggingFace(testImg, testPrompt, hfKey);
        results.huggingface = { status: "ok", latencyMs: Date.now() - start };
      } catch (e: any) { results.huggingface = { status: "error", message: e.message }; }
    } else { results.huggingface = { status: "no_key" }; }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}