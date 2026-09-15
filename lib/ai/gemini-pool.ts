const verifiedKeys = [
  "AIzaSyBxYI7rpak8iYWkrAh7Py4r49YMLxT1DFA",
  "AIzaSyDMRfGflkVIVv6WWrMcTTaPWfyP1VJed9c",
  "AIzaSyCFvac0cjr8mRD672QNL5_Jq1F6xOYwoHY",
  "AIzaSyAtGph4HqYS0i953UkUheLqhecI6GnuohyA",
  "AIzaSyDB38rJ4uO5c-tLmMYJ7MZ0Y83V8KY3aZA",
  "AIzaSyD1-uYy2faAg86wywKzkmw_4a5_m7_1i4g",
  "AIzaSyA2ZR54_fmcg_uVzQjSUmqM4nF9wPh9byQ",
  "AIzaSyCP9sJchY2Ko_7mOgf9fxKTN-3ECF1D2vQ",
  "AIzaSyBBpPSi_NfQywGilr31mOz7PfZNw"
];

export const DEFAULT_GEMINI_KEYS = verifiedKeys;

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

  // Try models in order: gemini-2.5-flash (fastest/latest), gemini-flash-latest
  const models = ["gemini-2.5-flash", "gemini-flash-latest"];

  for (let attempt = 0; attempt < Math.min(totalKeys, 5); attempt++) {
    const keyIdx = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = keys[keyIdx];
    const startTime = Date.now();

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
              temperature: 0.4,
              maxOutputTokens: 120,
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
  }

  throw new Error("فشلت محاولة الاتصال بنماذج Gemini: " + lastError?.message);
}