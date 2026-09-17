if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Cloudflare tokens cannot be loaded on the client side.");
}

const rawTokens = process.env.CLOUDFLARE_TOKENS 
  ? process.env.CLOUDFLARE_TOKENS.split(',')
  : [
      Buffer.from("Y2Z1dF9LTVJnUmZLSzNVNHlqWE95anl6aWw0d2tPdDZYSEVyMzI2UlNCcUE5NmIzMjNkNDU=", "base64").toString("utf-8"),
      Buffer.from("Y2Z1dF91VVljWW1YZndLWnRJWHpUeTFHYTRNU01vYjZZZ0kwQmpGb05ZaWxZNTljNTdkZWU=", "base64").toString("utf-8")
    ];

export const CLOUDFLARE_TOKENS = rawTokens;

export function getCloudflareTokenCount(): number {
  return rawTokens.length;
}

let currentTokenIndex = 0;

export async function analyzeWithCloudflarePool(
  imageBase64: string,
  prompt: string,
  accountId?: string,
  customTokens?: string[]
): Promise<{ text: string; latencyMs: number; tokenUsed: string }> {
  const accId = accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accId) {
    throw new Error("Cloudflare Account ID غير محدد. يرجى إدخاله في لوحة التحكم.");
  }

  const tokens = (customTokens && customTokens.length > 0) ? customTokens : CLOUDFLARE_TOKENS;
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageArray = Array.from(Buffer.from(base64Data, 'base64'));
  const total = tokens.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < total; attempt++) {
    const idx = (currentTokenIndex + attempt) % total;
    const token = tokens[idx];
    const startTime = Date.now();

    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: `مهم جداً: الإجابة باللغة العربية الفصحى البسيطة فقط بدون أي إنجليزية وبدون ماركداون:\n${prompt}`,
          image: imageArray,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errData.errors || response.statusText)}`);
      }

      const data = await response.json();
      const text = data.result?.response || data.result?.description || "تم التحليل عبر Cloudflare.";
      const latencyMs = Date.now() - startTime;
      currentTokenIndex = idx;

      return { text, latencyMs, tokenUsed: token.slice(0, 10) + "..." + token.slice(-4) };
    } catch (err: any) {
      lastError = err;
      console.warn(`Cloudflare token ${idx} failed (${err.message}), trying next token...`);
    }
  }

  throw new Error(`جميع مفاتيح Cloudflare فشلت. آخر خطأ: ${lastError?.message}`);
}