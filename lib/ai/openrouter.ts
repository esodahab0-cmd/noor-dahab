// =========================================================================
// Noor Dahab — OpenRouter Vision Engine (Qwen 2.5 VL 72B & Deep Analysis)
// مخصص لتحليل الأدوية بدقة فائقة وقراءة التفاصيل المعقدة للمكفوفين
// =========================================================================

// SERVER-ONLY PROTECTION: Prevent leaking raw API keys into client bundles
if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: OpenRouter key pool cannot be loaded on the client side.");
}

const rawOrKeys = [
  Buffer.from("c2stb3ItdjEtZTU4NDI3YmZlOGQxMzU1YzgwNGE4OWI4ZjllMjRiZDlkZjIyYTQ4ZDQ3MDk4ZDgwNGMwMDE1ZjM5M2EzYWFmOQ==", "base64").toString("utf-8"),
  Buffer.from("c2stb3ItdjEtODAzMGMwMmQzZmEwMTEwOGY4MWE5M2UyODY0NGVjM2ExNzI3N2Q5YTk4YjM3MTc0NTE2NTliMDM3ODg2ZjkxMw==", "base64").toString("utf-8")
];

export const OPENROUTER_KEYS_POOL: string[] = rawOrKeys;

let currentKeyIndex = 0;

export function getNextOpenRouterKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 10) return customKey.trim();
  const key = OPENROUTER_KEYS_POOL[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENROUTER_KEYS_POOL.length;
  return key;
}

export async function analyzeWithOpenRouter(
  imageBase64: string,
  prompt: string,
  apiKey?: string,
  modelName: string = "qwen/qwen2.5-vl-72b-instruct"
): Promise<{ text: string; latencyMs: number; modelUsed: string }> {
  const startTime = Date.now();
  const key = getNextOpenRouterKey(apiKey);

  const userContent: any[] = [{ type: "text", text: prompt }];

  if (imageBase64 && imageBase64.length > 50) {
    const imageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl }
    });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json; charset=utf-8",
      "HTTP-Referer": "https://dahabsoftware.online",
      "X-Title": "Noor Dahab AI Blind Assistant",
    },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      model: modelName,
      max_tokens: 600,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "أنت المساعد الصوتي 'نور دهب' لخدمة المكفوفين. يجب أن تجيب بالعامية المصرية البسيطة والواضحة جداً حصراً، بدون أي تخمين أو تأليف، وبدون أي كلمة إنجليزية وبدون ماركداون."
        },
        {
          role: "user",
          content: userContent
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "لم يتم استخراج وصف دقيق.";
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs, modelUsed: modelName };
}
