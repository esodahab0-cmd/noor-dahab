import { AIAnalysisRequest, AIAnalysisResponse, AIKeysConfig } from "./types";
import { analyzeWithGroq } from "./groq";
import { analyzeWithGeminiPool } from "./gemini-pool";
import { analyzeWithCloudflarePool } from "./cloudflare-pool";
import { analyzeWithHuggingFace } from "./huggingface";

export function buildSystemPrompt(
  mode: string = "general",
  locationInfo?: { addressText?: string },
  registeredFaces?: Array<{ name: string; description: string }>
): string {
  let locationContext = "";
  if (locationInfo?.addressText) {
    locationContext = `المستخدم متواجد حالياً في: "${locationInfo.addressText}".`;
  }

  let facesContext = "";
  if (registeredFaces && registeredFaces.length > 0) {
    facesContext = "قائمة الأشخاص المألوفين المسجلين لدى الكفيف:\n" +
      registeredFaces.map(f => `- ${f.name}: ${f.description}`).join("\n") +
      "\nإذا رأيت شخصاً يتطابق مع أي من هذه الأوصاف، اذكر اسمه فوراً للمستخدم.";
  }

  const base = `أنت "نور دهب"، المساعد الذكي الصوتي الشخصي للمكفوفين وضعاف البصر باللغة العربية.
صف ما تراه الكاميرا بأسلوب فوري، موجز، واضح جداً وطبيعي ليتم نطقه صوتياً بدون أي علامات ماركداون أو نجوم أو عناوين.
${locationContext}
${facesContext}`;

  switch (mode) {
    case "read_text":
      return `${base}\nالمطلوب: اقرأ جميع النصوص والكلمات المكتوبة في الصورة بدقة ونطق واضح.`;
    case "currency":
      return `${base}\nالمطلوب: حدد فئة العملة الورقية أو المعدنية وقيمتها النقدية وحالتها.`;
    case "medication":
      return `${base}\nالمطلوب الطبي: اقرأ اسم علبة الدواء بدقة، وتاريخ انتهاء الصلاحية (Expiry date)، والجرعة إن وجدت، وحذر الكفيف إذا كان التاريخ منتهياً أو غير واضح.`;
    case "faces":
      return `${base}\nالمطلوب: صف الشخص الواقف أمام الكاميرا، تقدير عمره، ملامحه، تعبيرات وجهه، وما يرتديه، وهل يطابق أحد المقربين المسجلين.`;
    case "obstacle":
      return `${base}\nالمطلوب الأمني: حدد أقرب عائق أو عقبة أمام الكفيف (مثل درجات سلم، حفرة، عمود، باب زجاجي) وقدر المسافة بالخطوات بدقة للمحافظة على سلامته.`;
    case "location":
      return `${base}\nالمطلوب: صف معالم المكان الحالي والممرات والأبواب لحركة آمنة.`;
    default:
      return `${base}\nالمطلوب: صف المشهد العام أمام الكاميرا بإيجاز مفيد لحركة الكفيف.`;
  }
}

export async function processVisionWithFallback(
  req: AIAnalysisRequest,
  keys: AIKeysConfig
): Promise<AIAnalysisResponse> {
  const prompt = req.customPrompt || buildSystemPrompt(req.mode, req.locationInfo);
  const attempted: string[] = [];

  // Tier 1: Google Gemini Multi-Key Rotation Pool (13 Keys)
  try {
    attempted.push("Gemini Key Pool (Tier 1)");
    const customKeys = keys.geminiKey ? [keys.geminiKey] : undefined;
    const result = await analyzeWithGeminiPool(req.imageBase64, prompt, customKeys);
    return {
      success: true,
      text: result.text,
      provider: "gemini",
      latencyMs: result.latencyMs,
      tierAttempted: attempted
    };
  } catch (err: any) {
    console.warn("Gemini Pool failed, attempting Groq fallback:", err.message);
  }

  // Tier 2: Groq LLaMA 3.2 Vision (Fast)
  const groqKey = keys.groqKey || process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      attempted.push("Groq Vision (Tier 2)");
      const r = await analyzeWithGroq(req.imageBase64, prompt, groqKey);
      return {
        success: true,
        text: r.text,
        provider: "groq",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      console.warn("Tier 2 Groq failed:", e.message);
    }
  }

  // Tier 3: Cloudflare Workers AI Pool (2 Tokens)
  const cfAccount = keys.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (cfAccount) {
    try {
      attempted.push("Cloudflare Pool (Tier 3)");
      const customTokens = keys.cloudflareApiToken ? [keys.cloudflareApiToken] : undefined;
      const r = await analyzeWithCloudflarePool(req.imageBase64, prompt, cfAccount, customTokens);
      return {
        success: true,
        text: r.text,
        provider: "cloudflare",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      console.warn("Tier 3 Cloudflare failed:", e.message);
    }
  }

  // Tier 4: Hugging Face
  const hfKey = keys.huggingfaceKey || process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    try {
      attempted.push("Hugging Face (Tier 4)");
      const r = await analyzeWithHuggingFace(req.imageBase64, prompt, hfKey);
      return {
        success: true,
        text: r.text,
        provider: "huggingface",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      console.warn("Tier 4 HF failed:", e.message);
    }
  }

  return {
    success: false,
    text: "عذراً، لم نتمكن من الاتصال بالذكاء الاصطناعي حالياً. يرجى مراجعة مفاتيح الـ API في لوحة التحكم.",
    provider: "gemini",
    latencyMs: 0,
    error: "All AI tiers failed.",
    tierAttempted: attempted
  };
}