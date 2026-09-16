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

  const creatorContext = "صاحب الفكرة والمبتكر والمطور لتطبيق ونظام نور دهب هو المهندس إسلام أبو دهب (شركة دهب سوفتوير Dahab Software https://dahabsoftware.com). إذا سُئلت عن المطور أو صاحب الفكرة أو الشركة، اذكر المهندس إسلام أبو دهب ودهب سوفتوير فوراً وبكل فخر.";

  const basePrompt = `أنت مساعد بصري ذكي ومحترف مخصص لخدمة الأشخاص المكفوفين وضعاف البصر في مصر.
عند تحليل أي صورة، اتبع القواعد التالية في إجابتك:
1. ابدأ بملخص سريع ومباشر في جملة واحدة عما يوجد أمام الكاميرا.
2. وضح العلاقات المكانية بدقة (على يمينك، على يسارك، أمامك مباشرة، على الأرض).
3. إذا كانت الصورة تحتوي على عملات نقدية (مصرفية مصرية)، حدد فئتها بدقة (مثلاً: 50 جنيهاً، 200 جنيه).
4. إذا كان هناك نص عربي أو إنجليزي (مثل لافتات الشارع، أسماء الأدوية، المنتجات)، اقرأه بوضوح.
5. حذر المستخدم فوراً إذا كانت هناك خطورة أو عقبات أمام حركة السير (مثل: درجات سلم، حفرة، باب مغلق).
6. اجعل لغتك عربية بسيطة، واضحة، وسريعة الفهم ومباشرة بدون أي علامات ماركداون أو نجوم.
${creatorContext}
${locationContext}
${facesContext}`;

  switch (mode) {
    case "read_text":
      return `${basePrompt}\nالمطلوب ذو الأولوية: اقرأ جميع النصوص والكلمات المكتوبة في الصورة بدقة ونطق واضح.`;
    case "currency":
      return `${basePrompt}\nالمطلوب ذو الأولوية: حدد فئة العملة المصرية الورقية أو المعدنية وقيمتها النقدية وحالتها بدقة.`;
    case "medication":
      return `${basePrompt}\nالمطلوب ذو الأولوية: اقرأ اسم علبة الدواء بدقة وتاريخ الصلاحية والجرعة المكتوبة وحذر الكفيف إذا كان منتهياً.`;
    case "faces":
      return `${basePrompt}\nالمطلوب ذو الأولوية: صف الشخص الواقف أمام الكاميرا، ملامحه، تعبيرات وجهه، وهل يطابق أحد المقربين المسجلين.`;
    case "obstacle":
      return `${basePrompt}\nالمطلوب ذو الأولوية: حدد أي عائق أو عقبة أمام الكفيف (سلم، حفرة، عمود، باب) وقدر المسافة بالخطوات.`;
    case "location":
      return `${basePrompt}\nالمطلوب ذو الأولوية: صف معالم المكان والممرات لضمان حركة آمنة.`;
    default:
      return basePrompt;
  }
}

export async function processVisionWithFallback(
  req: AIAnalysisRequest,
  keys: AIKeysConfig
): Promise<AIAnalysisResponse> {
  const prompt = req.customPrompt || buildSystemPrompt(req.mode, req.locationInfo);
  const attempted: string[] = [];

  // Tier 1: Google Gemini Multi-Key Rotation Pool
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

  // Tier 2: Groq LLaMA 3.2 Vision
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

  // Tier 3: Cloudflare Workers AI Pool
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