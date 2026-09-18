import { NextRequest, NextResponse } from "next/server";

// Local in-memory cache for audio clips to deliver zero-latency repeated phrases
const ttsCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>();
const MAX_CACHE_SIZE = 150;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");

    if (!text || !text.trim()) {
      return new NextResponse("Text parameter required", { status: 400 });
    }

    const cleanText = text.trim().slice(0, 450);
    const cacheKey = cleanText.toLowerCase();

    // 1. Check in-memory cache
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return new NextResponse(cached.buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-TTS-Source": "cache"
        }
      });
    }

    // 2. Multi-Tier Endpoints: Tier 1: Google TTS Engine with Egyptian Arabic preference
    const endpoints = [
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=ar&client=tw-ob`,
      `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ar-EG&q=${encodeURIComponent(cleanText)}`,
      `https://translate.google.com.eg/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=ar&client=webapp`
    ];

    let audioBuffer: ArrayBuffer | null = null;
    let successfulEndpoint = "";

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://translate.google.com/",
            "Accept": "*/*"
          }
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 200) {
            audioBuffer = buf;
            successfulEndpoint = url;
            break;
          }
        }
      } catch {
        // Try next fallback endpoint
      }
    }

    if (!audioBuffer) {
      // Return 503 so client immediately falls back to WebSpeech local synthesis
      return new NextResponse("TTS Service temporarily unavailable", { status: 503 });
    }

    // Cache management
    if (ttsCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = ttsCache.keys().next().value;
      if (oldestKey) ttsCache.delete(oldestKey);
    }
    ttsCache.set(cacheKey, { buffer: audioBuffer, timestamp: Date.now() });

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-TTS-Source": successfulEndpoint.includes("gtx") ? "gtx" : "google"
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Internal error", { status: 500 });
  }
}