const rawKeys = [
  Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
  Buffer.from("QUl6YVN5QXRHcGg0SHFZUzA5NTNVa1VoZUxxaGVjSTZHbnVvaHlB", "base64").toString("utf-8"),
  Buffer.from("QUl6YVN5REIzOHJKNHVPNGMteExtTVlKN01aMFk4M1Y4S1kzYVpB", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SW1aR1lMVW85Ujd0QkNNdlNlSVRGNE50ME1VcEJRLVAwbzVQWHhVYnFUd3c=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42S0hhVlRNZjQyeU03LUFrUnhJYTFYLVl0c2lhT01fanZ3TEp4YmszSnRHM1E=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SUdlSTVqWWVLQjRSdlJVMU5UX0I2RlRhbl9qZ3NKRHk1TUJYYnpjczFpNGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SlRKNmdYTjNuLVBqVmN6OWo4YU5VSmZsU0dXMExkOHFXQl9GaElrMjlieVE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42TEk3bC11eWZSZnNueHhJRzZVbFlzWkpFYWJfVnJBYk9BelI0a3ZwaUQxdlE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SU05VzFGZFpUektJcXVuQ3FFZ3JhQmJDTE5WejRTQ3ExaGdWdzZ4V1BaTnc=", "base64").toString("utf-8")
];

export const DEFAULT_GEMINI_KEYS = rawKeys;

let currentKeyIndex = 0;

export async function analyzeWithGeminiPool(
  imageBase64: string,
  prompt: string,
  customKeys?: string[]
): Promise<{ text: string; latencyMs: number; keyUsed: string }> {
  const keys = (customKeys && customKeys.length > 0 && customKeys[0]) 
    ? [...customKeys, ...DEFAULT_GEMINI_KEYS] 
    : DEFAULT_GEMINI_KEYS;

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const totalKeys = keys.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIdx = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = keys[keyIdx];
    if (!apiKey) continue;
    const startTime = Date.now();

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errBody.error || response.statusText)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("استجابة فارغة من Gemini");

      const latencyMs = Date.now() - startTime;
      currentKeyIndex = keyIdx;

      return {
        text: text.trim(),
        latencyMs,
        keyUsed: `Key #${keyIdx + 1} (${apiKey.slice(-4)})`
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error("تعذر الاتصال بالمفاتيح: " + lastError?.message);
}