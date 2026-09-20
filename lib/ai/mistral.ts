// =========================================================================
// Noor Dahab — Mistral AI Vision Engine (Pixtral 12B Vision)
// محرك الرؤية فائق السرعة من Mistral AI المخصص للمكفوفين
// =========================================================================

// SERVER-ONLY PROTECTION: Prevent leaking raw API keys into client bundles
if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Mistral key pool cannot be loaded on the client side.");
}

const rawMistralKeys = [
  Buffer.from("RW8yTzNuMTVpWlBtNTVNbXBldndlN090YlJQRHZObUk=", "base64").toString("utf-8"),
  Buffer.from("dnhWUERCQkpFNXFhUmJSWXNQMFVIelJlc0JvdE5mZ1I=", "base64").toString("utf-8")
];

export const MISTRAL_KEYS_POOL: string[] = rawMistralKeys;

export function getMistralPoolCount(): number {
  return rawMistralKeys.length;
}

let currentKeyIndex = 0;

export function getNextMistralKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 10) return customKey.trim();
  const key = MISTRAL_KEYS_POOL[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % MISTRAL_KEYS_POOL.length;
  return key;
}

export async function analyzeWithMistral(
  imageBase64: string,
  prompt: string,
  apiKey?: string,
  modelName: string = "pixtral-12b-2409"
): Promise<{ text: string; latencyMs: number; modelUsed: string }> {
  const startTime = Date.now();
  const key = getNextMistralKey(apiKey);

  const userContent: any[] = [{ type: "text", text: prompt }];

  if (imageBase64 && imageBase64.length > 50) {
    const imageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    userContent.push({
      type: "image_url",
      image_url: imageUrl
    });
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      model: modelName,
      max_tokens: 1200,
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
    throw new Error(`Mistral HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "لم يتم استخراج وصف دقيق.";
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs, modelUsed: modelName };
}
