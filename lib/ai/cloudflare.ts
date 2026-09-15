export async function analyzeWithCloudflare(
  imageBase64: string,
  prompt: string,
  accountId: string,
  apiToken: string
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageArray = Array.from(Buffer.from(base64Data, "base64"));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image: imageArray,
        max_tokens: 300
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudflare error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.result?.response || data.result?.description || "تم الوصف عبر Cloudflare.";
  const latencyMs = Date.now() - startTime;

  return { text, latencyMs };
}
