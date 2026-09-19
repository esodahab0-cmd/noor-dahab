// SERVER-ONLY PROTECTION: Prevent leaking raw API keys into client bundles
if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Gemini key pool cannot be loaded on the client side.");
}

// Active & verified Gemini API keys pool
const rawKeys = [
  Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SUdlSTVqWWVLQjRSdlJVMU5UX0I2RlRhbl9qZ3NKRHk1TUJYYnpjczFpNGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SlRKNmdYTjNuLVBqVmN6OWo4YU5VSmZsU0dXMExkOHFXQl9GaElrMjlieVE=", "base64").toString("utf-8")
];

export const DEFAULT_GEMINI_KEYS = rawKeys;

export function getGeminiPoolCount(): number {
  return rawKeys.length;
}

// Active & Supported Gemini models with automated failover
// Priority: gemini-flash-latest & lite are stable workhorses, then gemini-3.6/3.8
const ACTIVE_MODELS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-3.8-flash"
];

let currentKeyIndex = 0;

export async function analyzeWithGeminiPool(
  imageBase64: string,
  prompt: string,
  customKeys?: string[]
): Promise<{ text: string; latencyMs: number; keyUsed: string; modelUsed: string }> {
  const keys = (customKeys && customKeys.length > 0 && customKeys[0]) 
    ? [...customKeys, ...DEFAULT_GEMINI_KEYS] 
    : DEFAULT_GEMINI_KEYS;

  const base64Data = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, '') : "";
  const totalKeys = keys.length;
  let lastError: any = null;

  // إعداد أجزاء المحتوى (نص فقط أو نص مع صورة)
  const contentParts: any[] = [{ text: prompt }];
  if (base64Data && base64Data.length > 50) {
    contentParts.push({ inline_data: { mime_type: "image/jpeg", data: base64Data } });
  }

  // Try active models in order of priority
  for (const modelName of ACTIVE_MODELS) {
    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const keyIdx = (currentKeyIndex + attempt) % totalKeys;
      const apiKey = keys[keyIdx];
      if (!apiKey) continue;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: contentParts
            }],
            generationConfig: {
              temperature: 0.05,
              maxOutputTokens: 600,
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(errBody.error || response.statusText)}`);
        }

        clearTimeout(timeoutId);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("استجابة فارغة من Gemini");

        const latencyMs = Date.now() - startTime;
        // Advance to next key for true round-robin load distribution
        currentKeyIndex = (keyIdx + 1) % totalKeys;

        return {
          text: text.trim(),
          latencyMs,
          keyUsed: `Key #${keyIdx + 1} (${apiKey.slice(-4)})`,
          modelUsed: modelName
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Pool] Key #${keyIdx + 1} failed on ${modelName}: ${err.message}. Switching to next key...`);
        // Continue to next key or next model automatically
      }
    }
  }

  throw new Error("تعذر الاتصال بمفاتيح الذكاء الاصطناعي: " + lastError?.message);
}