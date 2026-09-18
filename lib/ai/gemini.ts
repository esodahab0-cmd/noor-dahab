if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Gemini client cannot be loaded on the client side.");
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeWithGemini(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: {
      temperature: 0.05,
      maxOutputTokens: 600,
    }
  });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs };
}
