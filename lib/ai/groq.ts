import Groq from "groq-sdk";

export async function analyzeWithGroq(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const groq = new Groq({ apiKey });

  const imageUrl = imageBase64.startsWith("data:") 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.2-11b-vision-preview",
    messages: [
      {
        role: "system",
        content: "أنت المساعد البصري 'نور دهب' لخدمة المكفوفين. يجب أن تجيب باللغة العربية الفصحى البسيطة حصراً وبدون أي كلمة إنجليزية إطلاقاً وبدون أي رموز ماركداون."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    temperature: 0.2,
    max_tokens: 600,
  });

  const text = completion.choices[0]?.message?.content || "لم يتم استخراج وصف.";
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs };
}
