// Gemini API Multi-Key Rotation Pool
// Keys are loaded from environment or encoded pool
const rawKeys = process.env.GEMINI_KEYS_POOL 
  ? process.env.GEMINI_KEYS_POOL.split(',') 
  : [
      Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEtTZmlrMHlHcTNJOFdsYzFGcWdsUQ==", "base64").toString("utf-8"),
      Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5QnhZSTdycGFrOGlZV2tyQWg3UHk0cjQ5WU1MeFQxREZB", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5RE1SZkdmbGtWSVZ2NldXck1jVFRhUFdmeVAxVkplZDlj", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5Q0Z2YWMwY2pyOG1SRDY3MlFOTDVfSnExRjZ4T1l3b0hZ", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5QXRHcGg0SHFZUzBpOTUzVWtVaGVMcWhlY0k2R251b2h5QQ==", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5REIzOHJKNHVPNWMteExtTVlKN01aMFk4M1Y4S1kzYVpB", "base64").toString("utf-8"),
      Buffer.from("QVEuQWI4Uk42SW1aR1lMVW85Ujd0QkNndlNlSVRENEN0TDBNVXBCUS1QMDBvNVA=", "base64").toString("utf-8"),
      Buffer.from("QVEuQWI4Uk42SnBwbHhQY19aMmt4cllHSHpGNHo3Y1UxcDlsMG9t", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5RDEtdVl5MmZhQWc4Nnd5d0t6a213XzRhNV9tN18xaTRn", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5QTJaUjU0X2ZtY2dfdVZ6UWpTVW1xTTRuRjl3UGg5YnlR", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5Q1A5c0pjaFkyS29fN21PZ2Y5ZnhLVE4tM0VDRjFEMnZR", "base64").toString("utf-8"),
      Buffer.from("QUl6YVN5QkJwUFNpX05mUXl3R2lscjMxbU96N1BmWk53", "base64").toString("utf-8")
    ];

export const DEFAULT_GEMINI_KEYS = rawKeys;

let currentKeyIndex = 0;

export async function analyzeWithGeminiPool(
  imageBase64: string,
  prompt: string,
  customKeys?: string[]
): Promise<{ text: string; latencyMs: number; keyUsed: string }> {
  const keys = (customKeys && customKeys.length > 0) ? customKeys : DEFAULT_GEMINI_KEYS;
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const totalKeys = keys.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIdx = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = keys[keyIdx];
    const startTime = Date.now();

    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error("HTTP " + response.status + ": " + JSON.stringify(errBody.error || response.statusText));
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("استجابة فارغة من Gemini");

      const latencyMs = Date.now() - startTime;
      currentKeyIndex = keyIdx;

      return {
        text: text.trim(),
        latencyMs,
        keyUsed: "Key #" + (keyIdx + 1) + " (" + apiKey.slice(-4) + ")"
      };
    } catch (err: any) {
      lastError = err;
      console.warn("Gemini key #" + (keyIdx + 1) + " failed: " + err.message + ", rotating to next key...");
    }
  }

  throw new Error("جميع مفاتيح Gemini في الحوض فشلت. آخر خطأ: " + lastError?.message);
}