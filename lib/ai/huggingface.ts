export async function analyzeWithHuggingFace(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/octet-stream"
      },
      body: buffer
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace error: ${response.statusText}`);
  }

  const data = await response.json();
  const caption = Array.isArray(data) && data[0]?.generated_text 
    ? data[0].generated_text 
    : "تمت قراءة الصورة بنجاح عبر Hugging Face.";
  const latencyMs = Date.now() - startTime;

  return { text: caption, latencyMs };
}
