import { AIAnalysisRequest, AIAnalysisResponse, AIKeysConfig, AnalysisMode } from "./types";
import { analyzeWithGroq } from "./groq";
import { analyzeWithGeminiPool } from "./gemini-pool";
import { analyzeWithCloudflarePool } from "./cloudflare-pool";
import { analyzeWithHuggingFace } from "./huggingface";
import { analyzeWithOpenRouter } from "./openrouter";
import { canExecuteProvider, recordProviderSuccess, recordProviderFailure } from "./circuitBreaker";
import { lookupVisionCache, saveVisionCache } from "./perceptualCache";

export function buildSystemPrompt(
  mode: AnalysisMode = "general",
  locationInfo?: { addressText?: string; street?: string; area?: string; city?: string; compassHeading?: string },
  registeredFaces?: Array<{ name: string; description: string }>,
  userQuestion?: string
): string {
  let locationContext = "";
  if (locationInfo?.street || locationInfo?.area || locationInfo?.addressText) {
    const locParts = [
      locationInfo.street,
      locationInfo.area,
      locationInfo.city
    ].filter(Boolean).join("، ");
    const fullLoc = locParts || locationInfo.addressText;
    locationContext = `المستخدم متواجد دلوقتي في: "${fullLoc}".` +
      (locationInfo.compassHeading ? ` وواقف متجه ناحية: ${locationInfo.compassHeading}.` : "");
  }

  let facesContext = "";
  if (registeredFaces && registeredFaces.length > 0) {
    facesContext = "قائمة الأشخاص المقربين المسجلين عند الكفيف:\n" +
      registeredFaces.map(f => `- ${f.name}: ${f.description}`).join("\n") +
      "\nلو شفت حد مطابق للمواصفات دي قوله اسمه فوراً بالمصري.";
  }

  const creatorContext = "صاحب الفكرة والمطور لتطبيق ونظام نور دهب هو المهندس إسلام أبو دهب (شركة دهب سوفتوير Dahab Software). لو سألك مين عمل التطبيق أو مين المطور، قوله فوراً: المهندس إسلام أبو دهب ودهب سوفتوير.";

  const basePrompt = `أنت المساعد البصري الذكي "نور دهب"، مخصص لخدمة إنسان كفيف (فاقد للبصر) في مصر.
قواعد صارمة وإلزامية لمنع التخريف والتأليف وضمان سلامة الكفيف 100%:
1. اللهجة المصرية العامية فقط: كلامك كله لازم يكون بالعامية المصرية البسيطة والواضحة جداً (لهجة الشارع المصري اليومية المحترمة، زي ابن بلد جدع بيسند كفيف وماشي معاه خطوة بخطوة). ممنوع منعاً باتاً الفصحى المعقدة، وممنوع نهائياً أي كلمة باللغة الإنجليزية (أي كلمة أو ماركة اقرأها أو ترجمها بالمصري).
2. ممنوع التخريف أو التأليف إطلاقاً: صف فقط اللي شايفه بعينك يقيناً في الصورة الحقيقية. ممنوع تتخيل أو تخمن أو تألف وجود أشخاص أو حاجات مش موجودة. لو الصورة مش واضحة أو مهزوزة أو مظلمة ومش باين منها حاجة، قول بأمانة وببساطة: "الصورة مش واضحة قدامي كويس، وضح الكاميرا شوية أو نور المكان".
3. الدقة المكانية والأمان: ركز على الحاجات الحقيقية المهمة للكفيف: العوائق في طريقه (كرسي، سلم، رصيف، حفرة، عربية، عمود)، المسافة التقريبية بالخطوات أو المتر، والاتجاه بالظبط (على يمينك، على شمالك، قدامك مباشرة، تحت رجلك). لو فيه أي خطر، حذره في أول كلمة.
4. التنسيق: ممنوع تماماً أي علامات ماركداون (مثل ** أو # أو * أو شرطات أو نقط أو أرقام). اكتب جمل سريعة وسلسة ومفهومة، لأن النص ده بيتقال بصوت فوري في ودن الكفيف مباشرة.
${creatorContext}
${locationContext}
${facesContext}`;

  if (userQuestion && userQuestion.trim()) {
    return `${basePrompt}
المستخدم الكفيف بيسألك بصوته دلوقتي: "${userQuestion.trim()}".
المطلوب منك: جاوب على سؤاله ده بالظبط بمنتهى الوضوح والدقة والصدق بالعامية المصرية السهلة من واقع الصورة الحقيقية بدون أي لف أو تأليف. لو بيطلب قراءة ورقة، اقرأ المكتوب فيها فوراً.`;
  }

  switch (mode) {
    case "colors":
      return `${basePrompt}\nالمطلوب لتنسيق الملابس: حدد اللون الدقيق للبس الظاهر (زي: كحلي، رمادي فاتح، أسود، نبيتي، زيتي)، ونوع القماشة (سادة، مقلم، كاروهات)، واديله نصيحة سريعة للتنسيق مع باقي اللبس بالبلدي.`;

    case "currency":
      return `${basePrompt}
المطلوب لفحص الفلوس: أنت خبير تدقيق عملات مصرية لمساعدة كفيف. افحص الفلوس المعروضة بدقة شديدة:
1. شوف الرقم المكتوب في زوايا الورقة (5، 10، 20، 50، 100، 200).
2. ميز خامة الورقة (الـ 10 والـ 20 البلاستيك البوليمر الجديدة، الـ 50 البنفسجي المخضر، الـ 100 البنفسجي، الـ 200 جنيه).
3. قول كل فئة شفتها وعددها كام ورقة بالبلدي، واختم بجملة واضحة: "المجموع الإجمالي: [المبلغ] جنيه مصري". لو الورقة مش واضحة أو مقطوعة أو مش مصرية، حذر الكفيف فوراً.`;

    case "find_object":
      return `${basePrompt}\nالمطلوب للبحث عن الحاجات الضايعة: دور بتركيز على الحاجات الشخصية (مفاتيح، محفظة، نظارة، موبايل، عصاية بيضا، ريموت). لو شفت الحاجة، حدد مكانها بالظبط بالنسبة لإيد الكفيف أو اتجاه الكاميرا بالمسافة التقريبية بالأشبار أو السنتيمتر.`;

    case "appliance":
      return `${basePrompt}\nالمطلوب لقراءة الشاشات والأجهزة: اقرأ بدقة الأرقام والرموز اللي على شاشة الجهاز المنزلي أو الطبي (غسالة، ميكروويف، ريموت تكييف، جهاز قياس السكر أو الضغط)، واذكر القيمة والحالة بوضوح.`;

    case "transit":
      return `${basePrompt}
المطلوب لمساعد المواصلات والمترو والشارع المصري:
أنت رفيق الكفيف في ركوب المواصلات في مصر (أتوبيس هيئة النقل العام، ميكروباص، ميني باص، مترو، سرفيس).
افحص الصورة بدقة شديدة:
1. اقرأ فوراً لافتة الوجهة أو رقم الخط (زي: "أتوبيس رقم 105"، "ميكروباص: الجيزة - التحرير"، "رمسيس"، "حلوان"، "الدقي").
2. لو شايف محطة مترو، اقرأ اسم المحطة والمدخل وأي لافتات اتجاهات (زي: "مدخل محطة السادات"، "اتجاه حلوان"، "اتجاه شبرا").
3. لو دي عربية ميكروباص أو تاكسي أو أتوبيس، حدد مكان الباب وهل العربية واقفة ولا متحركة، ومكانها فين بالنسبة للكفيف.
4. اتكلم بالعامية المصرية الصميمة وبسرعة وبدون أي تعقيد.`;

    case "barcode":
      return `${basePrompt}\nالمطلوب التجاري: اقرأ الباركود أو كود الـ QR أو بيانات المنتج، واذكر اسم المنتج التجاري، وحجمه، وتاريخ صلاحيته وسعره لو مكتوب.`;

    case "read_text":
      return `${basePrompt}
المطلوب لقراءة الأوراق واليافطات:
افحص الصورة بتركيز شديد واقرأ كل كلمة ورقم مكتوبين على الورقة أو المستند أو اليافطة من أولها لآخرها بالظبط بدون أي اختصار وبنطق مصري سليم.
لو الورقة فاتورة أو عقد أو تقرير أو روشتة، قول نوع الورقة إيه واقرأ الأسماء والتواريخ والمبالغ والأرقام بوضوح تام.`;

    case "medication":
      return `${basePrompt}\nالمطلوب للأدوية: اقرأ اسم علبة الدواء بدقة وتاريخ الصلاحية والجرعة المكتوبة، وحذر الكفيف فوراً لو الصلاحية منتهية، وفك شفرة خط الدكتور لو دي روشتة.`;

    case "faces":
      return `${basePrompt}\nالمطلوب: صف الشخص الواقف قدام الكاميرا، ملامحه، تعبيرات وشه، وهل يطابق حد من المقربين المسجلين.`;

    case "obstacle":
      return `${basePrompt}\nالمطلوب للأمان وتفادي العوائق: حدد أي عائق في طريق الكفيف (درجة سلم طالعة أو نازلة، حفرة، رصيف عالي، عمود نور، شجرة، باب زجاج، عربية راكنة، موتوسيكل) وقدر المسافة بالخطوات بالظبط بالمصري (مثلاً: "حاسب، قدامك رصيف عالي على بعد خطوتين").`;

    case "location":
      return `${basePrompt}\nالمطلوب: صف معالم المكان والممرات والشارع لضمان حركة آمنة للكفيف بالعامية المصرية.`;

    case "companion":
      return `${basePrompt}
المطلوب لوضع "رفيق الطريق":
أنت دلوقتي رفيق الطريق، ماشي جنب الكفيف في الشارع وبتوجهه خطوة بخطوة بالعامية المصرية الهادية.
طريقتك:
1. اتكلم كصديق وفيّ وإنسان حقيقي بلهجة مصرية هادية ومطمئنة في جملة أو جملتين بالكتير.
2. وجه حركته خطوة بخطوة: (زي: "الشارع قدامك سالك تمام كمل مشي"، أو "انحرف خطوة شمال عشان تتفادى حاجة على يمينك"، أو "قدامك درج سلم على بعد مترين").
3. طمنه واديله أمان أثناء السير، واذكر معالم الشارع والمكان باختصار وبدون رغي كتير.`;

    case "followup":
      return `${basePrompt}
المطلوب لمتابعة الاستفسار عن نفس المشهد أو الصورة السابقة (Visual Follow-up):
الكفيف التقط هذه الصورة بالفعل ويسألك سؤالاً تفصيلياً ومحدداً عنها:
"${userQuestion || "ماذا ترى في هذه الصورة بالتفصيل؟"}"
أجب عن سؤاله بالظبط وبشكل مباشر وفوري بالعامية المصرية الودودة في جملة أو جملتين دون إعادة وصف الصورة كلها ودون مقدمات، وركز فقط على إجابة ما سأل عنه بدقة.`;

    case "pos_shield":
      return `${basePrompt}
المطلوب لحارس ماكينة الدفع الإلكتروني والـ POS (POS & Payment Shield):
أنت حارس مالي أمني لحماية إنسان كفيف أثناء الدفع الإلكتروني في المحلات أو السوبرماركت (ماكينة فوري، أمان، أو ماكينة دفع بنكية POS).
افحص شاشة الماكينة أو الإيصال فوراً واستخرج الرقم المكتوب:
1. انطق المبلغ المالي المطلوب دفعه فقط برقم واضح وصريح بالجنيه المصري: "المبلغ المطلوب دفعه هو: [المبلغ] جنيه مصري".
2. لو مكتوب تم الدفع بنجاح أو العملية مقبولة/مرفوضة اذكرها فوراً في كلمة واحدة.
3. ممنوع أي رغي أو تفاصيل أخرى. سلامة فلوس الكفيف هي الأولوية القصوى.`;

    case "chat":
      return `أنت "نور دهب"، المساعد الشخصي الذكي والرفيق الودود لإنسان كفيف في مصر.
سألك الكفيف السؤال التالي أو يتحدث معك:
"${userQuestion || "أهلاً بك يا نور دهب"}"
المطلوب منك:
1. أجب عن سؤاله بالظبط وبأسلوب علمي ومبسط وسهل الفهم بالعامية المصرية الهادية والودودة في جملتين أو ثلاث جمل بالكتير.
2. لو كان سؤالاً عن التطبيق أو طريقة استخدامه، وضح له الأوامر الصوتية أو الميزات ببساطة.
3. لو كان سؤالاً علمياً أو ثقافياً أو عاماً، أجب بدقة وأمانة وموضوعية.
4. ممنوع أي رغي أو تطويل، وممنوع الكلمات الإنجليزية والرموز والماركداون، لأن كلامك سيُنطق للكفيف صوتياً مباشرة.`;

    default:
      return `${basePrompt}
المطلوب العام: صف اللي شايفه قدام الكاميرا بأسلوب مصري بسيط ومباشر ودقيق في جملتين أو تلاتة، بدون رغي أو مبالغة أو تخريف، واذكر أهم الحاجات قدام الكفيف ومكانها واتجاهها وبعدها عنه بالظبط.`;
  }
}

export async function processVisionWithFallback(
  req: AIAnalysisRequest,
  keys: AIKeysConfig
): Promise<AIAnalysisResponse> {
  const mode = req.mode || "general";
  const imageBase64 = req.imageBase64 || "";

  // ── Step 0: Fast Perceptual Vision Cache (< 40ms) ───────────
  const cacheHit = lookupVisionCache(imageBase64, mode, req.userQuestion);
  if (cacheHit.hit && cacheHit.text) {
    return {
      success: true,
      text: cacheHit.text,
      provider: "gemini",
      latencyMs: 35,
      tierAttempted: ["Smart Vision Cache (Instant Hit ⚡)"]
    };
  }

  const prompt = req.customPrompt || buildSystemPrompt(mode, req.locationInfo, undefined, req.userQuestion);
  const attempted: string[] = [];

  // ── High Accuracy Specialized Modes (الأدوية والتحليل الدقيق): OpenRouter Qwen 2.5 VL 72B ──
  const isSpecializedPrecisionMode = mode === "medication" || mode === "read_text" || mode === "appliance";
  if (isSpecializedPrecisionMode && canExecuteProvider("openrouter")) {
    try {
      attempted.push("OpenRouter Qwen 2.5 VL 72B (Specialized Precision Tier 🎯)");
      const customKey = keys.openrouterKey || process.env.OPENROUTER_API_KEY;
      const r = await analyzeWithOpenRouter(imageBase64, prompt, customKey, "qwen/qwen2.5-vl-72b-instruct");

      recordProviderSuccess("openrouter");
      saveVisionCache(imageBase64, mode, r.text, "openrouter", req.userQuestion);

      return {
        success: true,
        text: r.text,
        provider: "openrouter",
        latencyMs: r.latencyMs,
        isFallback: false,
        tierAttempted: attempted
      };
    } catch (e: any) {
      recordProviderFailure("openrouter", e.message);
      console.warn("OpenRouter Specialized Precision failed, continuing fallback pipeline:", e.message);
    }
  }

  // ── Tier 1: Google Gemini Multi-Key Rotation Pool ───────────
  if (canExecuteProvider("gemini")) {
    try {
      attempted.push("Gemini Key Pool (Tier 1)");
      const customKeys = keys.geminiKey ? [keys.geminiKey] : undefined;
      const result = await analyzeWithGeminiPool(imageBase64, prompt, customKeys);
      
      recordProviderSuccess("gemini");
      saveVisionCache(imageBase64, mode, result.text, "gemini", req.userQuestion);

      return {
        success: true,
        text: result.text,
        provider: "gemini",
        latencyMs: result.latencyMs,
        tierAttempted: attempted
      };
    } catch (err: any) {
      recordProviderFailure("gemini", err.message);
      console.warn("Gemini Pool failed, attempting Groq fallback:", err.message);
    }
  } else {
    attempted.push("Gemini Key Pool (Circuit OPEN ⚠️ - Skipped)");
  }

  // ── Tier 2: Groq LLaMA 3.2 Vision ────────────────────────────
  const groqKey = keys.groqKey || process.env.GROQ_API_KEY;
  if (groqKey && canExecuteProvider("groq")) {
    try {
      attempted.push("Groq Vision (Tier 2)");
      const r = await analyzeWithGroq(imageBase64, prompt, groqKey);
      
      recordProviderSuccess("groq");
      saveVisionCache(imageBase64, mode, r.text, "groq", req.userQuestion);

      return {
        success: true,
        text: r.text,
        provider: "groq",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      recordProviderFailure("groq", e.message);
      console.warn("Tier 2 Groq failed:", e.message);
    }
  } else if (groqKey) {
    attempted.push("Groq Vision (Circuit OPEN ⚠️ - Skipped)");
  }

  // ── Tier 3: Cloudflare Workers AI Pool ───────────────────────
  const cfAccount = keys.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (cfAccount && canExecuteProvider("cloudflare")) {
    try {
      attempted.push("Cloudflare Pool (Tier 3)");
      const customTokens = keys.cloudflareApiToken ? [keys.cloudflareApiToken] : undefined;
      const r = await analyzeWithCloudflarePool(imageBase64, prompt, cfAccount, customTokens);
      
      recordProviderSuccess("cloudflare");
      saveVisionCache(imageBase64, mode, r.text, "cloudflare", req.userQuestion);

      return {
        success: true,
        text: r.text,
        provider: "cloudflare",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      recordProviderFailure("cloudflare", e.message);
      console.warn("Tier 3 Cloudflare failed:", e.message);
    }
  } else if (cfAccount) {
    attempted.push("Cloudflare Pool (Circuit OPEN ⚠️ - Skipped)");
  }

  // ── Tier 4: Hugging Face ─────────────────────────────────────
  const hfKey = keys.huggingfaceKey || process.env.HUGGINGFACE_API_KEY;
  if (hfKey && canExecuteProvider("huggingface")) {
    try {
      attempted.push("Hugging Face (Tier 4)");
      const r = await analyzeWithHuggingFace(imageBase64, prompt, hfKey);
      
      recordProviderSuccess("huggingface");
      saveVisionCache(imageBase64, mode, r.text, "huggingface", req.userQuestion);

      return {
        success: true,
        text: r.text,
        provider: "huggingface",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      recordProviderFailure("huggingface", e.message);
      console.warn("Tier 4 HF failed:", e.message);
    }
  } else if (hfKey) {
    attempted.push("Hugging Face (Circuit OPEN ⚠️ - Skipped)");
  }

  // ── Tier 5: OpenRouter High-Capacity Pool (Llama/Qwen VL) ──
  if (canExecuteProvider("openrouter")) {
    try {
      attempted.push("OpenRouter Vision Pool (Tier 5)");
      const customKey = keys.openrouterKey || process.env.OPENROUTER_API_KEY;
      const r = await analyzeWithOpenRouter(imageBase64, prompt, customKey, "qwen/qwen2.5-vl-72b-instruct");

      recordProviderSuccess("openrouter");
      saveVisionCache(imageBase64, mode, r.text, "openrouter", req.userQuestion);

      return {
        success: true,
        text: r.text,
        provider: "openrouter",
        latencyMs: r.latencyMs,
        isFallback: true,
        tierAttempted: attempted
      };
    } catch (e: any) {
      recordProviderFailure("openrouter", e.message);
      console.warn("Tier 5 OpenRouter failed:", e.message);
    }
  } else {
    attempted.push("OpenRouter Vision Pool (Circuit OPEN ⚠️ - Skipped)");
  }

  return {
    success: false,
    text: "معلش، مش قادر اتصل بالذكاء الاصطناعي دلوقتي. اتأكد من النت وجرب تاني يا فندم.",
    provider: "gemini",
    latencyMs: 0,
    error: "All AI tiers failed.",
    tierAttempted: attempted
  };
}