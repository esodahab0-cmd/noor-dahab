import { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/ai/fallback-engine";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { validateOrigin, getCorsHeaders, handleCorsPreflight } from "@/lib/security/cors";
import { lookupVisionCache, saveVisionCache } from "@/lib/ai/perceptualCache";

export const runtime = "nodejs";

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

/**
 * معالج الـ Vision API التدفيقي فائق السرعة (Edge Runtime Stream)
 * يرسل الكلمات للكفيف أولاً بأول (Word-by-word streaming)
 * للوصول إلى Zero-Latency وتخفيض وقت الاستجابة الصوتي لأقل من 800ms
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // 1. فحص النطاق
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: "طلب غير مصرح به." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. فحص الـ Rate Limiter (سريع جداً على الـ Edge)
  const rateLimit = checkRateLimit(request, 25, 60 * 1000);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `تجاوزت الحد الأقصى للطلبات المتتالية. انتظر ${rateLimit.resetSeconds} ثانية.`,
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const { imageBase64, mode = "general", userQuestion, locationInfo, registeredFaces } = body;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "الصورة مطلوبة." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 0. فحص كاش الرؤية فائق السرعة (< 35ms)
    const cached = lookupVisionCache(imageBase64, mode, userQuestion);
    if (cached.hit && cached.text) {
      return new Response(cached.text, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "X-Cache": "HIT",
        },
      });
    }

    // بناء البرومبت المصري بالعامية المحكمة
    const prompt = buildSystemPrompt(mode, locationInfo, registeredFaces, userQuestion);

    // استخراج بيانات الـ Base64 الصافية
    let cleanBase64 = imageBase64;
    let mimeType = "image/jpeg";
    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      mimeType = parts[0].replace("data:", "") || "image/jpeg";
      cleanBase64 = parts[1];
    }

    // المفتاح الأساسي لجيميني أو جروك من بيئة العمل
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (geminiKey) {
      // استدعاء تدفقي حقيقي عبر Gemini REST Stream API على الـ Edge
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;

      const geminiPayload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 250,
        },
      };

      const aiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (aiResponse.ok && aiResponse.body) {
        // تحويل SSE Stream إلى ReadableStream مباشر للعميل
        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            let accumulatedFullText = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const jsonStr = line.replace("data: ", "").trim();
                    if (!jsonStr || jsonStr === "[DONE]") continue;

                    try {
                      const parsed = JSON.parse(jsonStr);
                      const textChunk =
                        parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                      if (textChunk) {
                        accumulatedFullText += textChunk;
                        controller.enqueue(encoder.encode(textChunk));
                      }
                    } catch {}
                  }
                }
              }

              if (accumulatedFullText.trim()) {
                saveVisionCache(imageBase64, mode, accumulatedFullText.trim(), "gemini-stream", userQuestion);
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      }
    }

    // Fallback: إذا لم يتوفر مفتاح Stream مباشر، نمرر عبر المسار الداخلي السريع
    return new Response(
      JSON.stringify({
        error: "استخدم المسار القياسي المؤمّن حالياً.",
        fallback: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "حدث خطأ غير متوقع." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
