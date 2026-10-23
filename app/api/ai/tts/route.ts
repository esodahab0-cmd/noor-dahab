import { NextRequest, NextResponse } from "next/server";
import { validateOrigin, getCorsHeaders } from "@/lib/security/cors";
import { checkRateLimit } from "@/lib/security/rate-limiter";

// Local in-memory cache for audio clips to deliver zero-latency repeated phrases
const ttsCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const MAX_CACHE_SIZE = 200;

function splitIntoTTSChunks(text: string, maxLen = 140): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current ? current + " " + word : word).length <= maxLen) {
      current = current ? current + " " + word : word;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

async function fetchAudioChunk(chunkText: string): Promise<Buffer | null> {
  const endpoints = [
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=ar&client=tw-ob`,
    `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ar-EG&q=${encodeURIComponent(chunkText)}`,
    `https://translate.google.com.eg/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=ar&client=webapp`
  ];

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
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > 200) {
          return buf;
        }
      }
    } catch {
      // Try next endpoint
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  if (!validateOrigin(request)) {
    return new NextResponse("Unauthorized Origin", { status: 403, headers: corsHeaders });
  }

  // Rate limiting for TTS audio requests (60 per minute per IP)
  const rateLimit = checkRateLimit(request, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return new NextResponse("Rate limit exceeded", { status: 429, headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");

    if (!text || !text.trim()) {
      return new NextResponse("Text parameter required", { status: 400, headers: corsHeaders });
    }

    // Clean text and limit maximum reasonable reading length (up to 1200 characters)
    const cleanText = text.trim().slice(0, 1200);
    const cacheKey = cleanText.toLowerCase();

    // 1. Check in-memory cache
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return new NextResponse(cached.buffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-TTS-Source": "cache"
        }
      });
    }

    // 2. Multi-Chunk Parallel Streaming (Handles long text from images, documents, and books seamlessly)
    const chunks = splitIntoTTSChunks(cleanText, 140);
    const buffers = await Promise.all(chunks.map(chunk => fetchAudioChunk(chunk)));

    const validBuffers = buffers.filter((b): b is Buffer => b !== null);
    if (validBuffers.length === 0) {
      // Return 503 so client immediately falls back to WebSpeech local synthesis
      return new NextResponse("TTS Service temporarily unavailable", { status: 503, headers: corsHeaders });
    }

    const combinedBuffer = Buffer.concat(validBuffers);

    // Cache management
    if (ttsCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = ttsCache.keys().next().value;
      if (oldestKey) ttsCache.delete(oldestKey);
    }
    ttsCache.set(cacheKey, { buffer: combinedBuffer, timestamp: Date.now() });

    return new NextResponse(combinedBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-TTS-Source": "google-multi-chunk"
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Internal error", { status: 500, headers: corsHeaders });
  }
}
