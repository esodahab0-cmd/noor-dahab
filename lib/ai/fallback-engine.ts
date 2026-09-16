import { AIAnalysisRequest, AIAnalysisResponse, AIKeysConfig, AnalysisMode } from "./types";
import { analyzeWithGroq } from "./groq";
import { analyzeWithGeminiPool } from "./gemini-pool";
import { analyzeWithCloudflarePool } from "./cloudflare-pool";
import { analyzeWithHuggingFace } from "./huggingface";

export function buildSystemPrompt(
  mode: AnalysisMode = "general",
  locationInfo?: { addressText?: string },
  registeredFaces?: Array<{ name: string; description: string }>,
  userQuestion?: string
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

  const basePrompt = `أنت المساعد البصري الذكي "نور دهب"، مصمم خصيصاً لخدمة فاقدي البصر (المكفوفين) في مصر والعالم العربي.
قواعد صارمة وإلزامية يجب اتباعها بدقة:
1. اللغة: إجابتك بالكامل يجب أن تكون باللغة العربية الفصحى البسيطة والواضحة حصراً. ممنوع منعاً باتاً كتابة أو نطق أي كلمة أو جملة باللغة الإنجليزية حتى لو كان النص في الصورة باللغة الإنجليزية (اقرأه بالمعنى أو انطقه باللغة العربية بوضوح تام).
2. التنسيق: ممنوع تماماً استخدام أي علامات ماركداون (مثل ** أو # أو * أو شرطات أو تعداد نقطي أو أرقام قوائم). اكتب جملاً متتابعة وسلسة ومفهومة، لأن النص يُقرأ بمحرك صوتي للأذن مباشرة.
3. الدقة والبساطة: صف المشهد بواقعية وبساطة تناسب كفيفاً، دون مبالغة أو تخمين غير مؤكد. ابدأ بالشيء الأساسي والموقع المكاني الدقيق (أمامك مباشرة، على يمينك، على يسارك، على الأرض).
4. قراءة الأوراق والمستندات: إذا كان هناك ورقة، تقرير، خطاب، كتاب، فاتورة، أو كتابة، اقرأ كل النصوص والأرقام المكتوبة فيها بدقة وأمانة كاملة وبصوت واضح.
5. التحذير والأمان: حذر المستخدم فوراً إذا كانت هناك أي خطورة على حركته (مثل درجات سلم، حفرة، رصيف مرتفع، باب زجاجي، سيارة قادمة).
${creatorContext}
${locationContext}
${facesContext}`;

  if (userQuestion && userQuestion.trim()) {
    return `${basePrompt}
المستخدم الكفيف يسألك بصوته الآن: "${userQuestion.trim()}".
المطلوب منك: أجب عن سؤال أو طلب المستخدم هذا بالتحديد بكل وضوح ودقة وبساطة باللغة العربية الفصحى فقط، بناءً على كل ما يظهر في الكاميرا. إذا كان يطلب قراءة ورقة، اقرأ المكتوب فيها فوراً.`;
  }

  switch (mode) {
    case "colors":
      return `${basePrompt}\nالمطلوب الخاص بالملابس: حدد اللون الدقيق للقطعة أو القطع الظاهرة (مثل: أزرق كحلي، رمادي فاتح، أسود، نبيتي)، ونوع النقشة (سادة، مقلم، كاروهات)، وقدم نصيحة فورية لتنسيقها وتوافقها مع القطع الأخرى للمكفوفين.`;

    case "currency":
      return `${basePrompt}\nالمطلوب المحاسبي الدقيق: أنت خبير تدقيق مالي لمساعدة كفيف. افحص الأوراق والعملات النقدية (المصرية) المعروضة بدقة شديدة مع التركيز على:
1. فحص الأرقام المطبوعة على زوايا الورقة (5, 10, 20, 50, 100, 200).
2. تمييز خامة الورقة ولونها (الـ 10 والـ 20 البلاستيك بوليمر الجديدة، الـ 50 البنفسجي المائل للأخضر، الـ 100 البنفسجي، الـ 200 جنيه).
3. اذكر كل فئة تم رصدها وعدد أوراقها، ثم اختم بجملة قاطعة: "المجموع الإجمالي: [المبلغ بالأرقام والكلمات] جنيهاً مصرياً". إذا كانت العملة غير مصرية أو غير واضحة، حذر الكفيف فوراً.`;

    case "find_object":
      return `${basePrompt}\nالمطلوب للبحث عن المفقودات: افحص الصورة بدقة للبحث عن الأشياء الشخصية المعتادة (مفاتيح، محفظة، نظارة، هاتف، عصا بيضاء، ريموت). إذا رأيت الشيء، حدد مكانه الدقيق بالنسبة ليد المستخدم أو اتجاه الكاميرا بالمسافة التقريبية بالأشبار أو السنتيمترات فوراً.`;

    case "appliance":
      return `${basePrompt}\nالمطلوب لقراءة الشاشات والأجهزة: اقرأ بدقة متناهية الأرقام والرموز الرقمية المعروضة على شاشة الجهاز المنزلي أو الطبي (مثل شاشة الميكروويف، الغسالة، ريموت التكييف، جهاز قياس السكر، أو الضغط)، واذكر الحالة والوقت أو القيمة بدقة تامة.`;

    case "transit":
      return `${basePrompt}\nالمطلوب للمواصلات والشارع: اقرأ فوراً لافتات مقدمة السيارات أو الأتوبيسات أو الميكروباصات الظاهرة، واذكر رقم الخط ووجهة السير المكتوبة باللغة العربية بوضوح لمساعدة الكفيف في المحطة.`;

    case "barcode":
      return `${basePrompt}\nالمطلوب التجاري: اقرأ الباركود أو كود الاستجابة السريعة (QR) أو بيانات المنتج التجاري، واذكر اسم المنتج التجاري، حجمه، وتاريخ صلاحيته وسعره إن كان مدوناً.`;

    case "read_text":
      return `${basePrompt}
المطلوب ذو الأولوية القصوى (قراءة الأوراق والمستندات واللافتات):
افحص الصورة بدقة شديدة واقرأ كافة النصوص والكلمات والأرقام المكتوبة على هذه الورقة أو المستند أو الشاشة أو اللافتة من البداية إلى النهاية بدون اختصار.
إذا كانت الورقة مستنداً رسمياً أو فاتورة أو عقداً أو تقريراً، اذكر نوع المستند ثم اقرأ البيانات والأسماء والتواريخ والأرقام المكتوبة بوضوح تام باللغة العربية.`;

    case "medication":
      return `${basePrompt}\nالمطلوب الطبي: اقرأ اسم علبة الدواء بدقة وتاريخ الصلاحية والجرعة المكتوبة وحذر الكفيف إذا كان منتهياً، وقم بفك شفرة خط الطبيب إن كانت روشتة.`;

    case "faces":
      return `${basePrompt}\nالمطلوب: صف الشخص الواقف أمام الكاميرا، ملامحه، تعبيرات وجهه، وهل يطابق أحد المقربين المسجلين.`;

    case "obstacle":
      return `${basePrompt}\nالمطلوب الأمني: حدد أي عائق أو عقبة أمام الكفيف (سلم، حفرة، عمود، باب) وقدر المسافة بالخطوات.`;

    case "location":
      return `${basePrompt}\nالمطلوب: صف معالم المكان والممرات لضمان حركة آمنة.`;

    case "companion":
      return `${basePrompt}
المطلوب لوضع "رفيق الطريق":
أنت الآن "رفيق الطريق"، مرافق بشري ومبصر مخلص يسير جنباً إلى جنب مع الكفيف.
طريقة إرشادك وتحدثك:
1. تحدث كصديق وفيّ وإنسان حقيقي بنبرة هادئة ومطمئنة في جملة واحدة أو جملتين موجزتين جداً.
2. وجه حركته خطوة بخطوة: (مثل: "الطريق أمامك سالك تماماً يا فندم، استمر في المشي"، أو "انحرف خطوة بسيطة لليسار لتفادي عائق على يمينك"، أو "أمامك درجات سلم على بعد مترين").
3. طمئنه وأعطه ثقة كاملة أثناء السير، واذكر المعالم الرئيسية للشارع والمكان بدون إطالة أو تكرار ممل.`;

    default:
      return `${basePrompt}
المطلوب العام: صف ما تراه أمام الكاميرا بأسلوب بسيط ومباشر ودقيق في جملتين إلى ثلاث جمل واضحة، بدون حشو أو إطالة، واذكر أهم الأشياء أمام الكفيف ومكانها واتجاهها ومسافتها.`;
  }
}

export async function processVisionWithFallback(
  req: AIAnalysisRequest,
  keys: AIKeysConfig
): Promise<AIAnalysisResponse> {
  const prompt = req.customPrompt || buildSystemPrompt(req.mode, req.locationInfo, undefined, req.userQuestion);
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