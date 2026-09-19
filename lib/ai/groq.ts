import Groq from "groq-sdk";

export async function analyzeWithGroq(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const groq = new Groq({ apiKey });

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

  const completion = await groq.chat.completions.create({
    model: "llama-3.2-11b-vision-preview",
    messages: [
      {
        role: "system",
        content: "أنت المساعد الصوتي 'نور دهب' لخدمة المكفوفين. يجب أن تجيب بالعامية المصرية البسيطة والواضحة جداً حصراً، بدون أي تخمين أو تأليف، وبدون أي كلمة إنجليزية وبدون ماركداون."
      },
      {
        role: "user",
        content: userContent
      }
    ],
    temperature: 0.05,
    max_tokens: 600,
  });

  const text = completion.choices[0]?.message?.content || "لم يتم استخراج وصف.";
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs };
}
