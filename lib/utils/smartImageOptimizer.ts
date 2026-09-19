/**
 * Smart Adaptive Image Optimizer & Zero-Latency Blur Detector
 * 
 * نظام الضغط التكيفي الذكي للصور وفحص الاهتزاز لتطبيق "نور دهب"
 * 
 * آلية العمل (Adaptive Compression Mechanism):
 * 1. Task-Aware Dynamic Resizing: يحدد أبعاد وضغط الصورة بناءً على الغرض:
 *    - نمط المستندات والنصوص (Document/OCR): تصدير بدقة تصل إلى 1280px وجودة JPEG 0.82
 *      لضمان وضوح تفاصيل الحروف والأرقام الدقيقة والروشتات.
 *    - نمط المشاهد العامة والأجسام (General/Scene/Objects): تصدير بأبعاد 640px وجودة JPEG 0.60
 *      لتقليل حجم الصورة لأقل من 45KB وضمان إرسالها بسرعة طلقة حتى على شبكات 3G/4G الضعيفة.
 * 2. Blur Detection (كشف الاهتزاز السريع):
 *    - استخدام خوارزمية تباين الحواف (Variance of Laplacian approximation) على صورة رمادية مصغرة.
 *    - إذا كانت النتيجة أقل من الحد الأدنى للحدة، يتم رفض الإرسال وتنبيه الكفيف صوتياً
 *      "يرجى تثبيت الكاميرا، الصورة مهزوزة" لتوفير الوقت والبيانات والـ API quota.
 */

export interface OptimizedImageResult {
  base64: string;
  isBlurred: boolean;
  blurScore: number;
  width: number;
  height: number;
  mode: string;
}

export interface OptimizationConfig {
  maxDimension: number;
  quality: number;
}

/**
 * تحديد إعدادات الضغط المثلى بناءً على نوع مهمة الذكاء الاصطناعي
 */
export function getOptimizationConfig(mode: string): OptimizationConfig {
  switch (mode) {
    case "read_text":
    case "document":
    case "currency":
    case "describe_doc":
      // دقة عالية جداً للخطوط والأرقام والتفاصيل الورقية
      return { maxDimension: 1280, quality: 0.82 };

    case "color":
    case "find_item":
    case "hazard":
    case "navigate":
      // دقة متوسطة متوازنة وسريعة
      return { maxDimension: 800, quality: 0.70 };

    case "general":
    case "explore":
    case "followup":
    default:
      // سرعة قصوى للمشاهد العامة والأجسام (أقل استهلاك شبكة)
      return { maxDimension: 640, quality: 0.60 };
  }
}

/**
 * فحص حدة الصورة واكتشاف الاهتزاز السريع (Fast Blur Detection)
 * عبر قياس تباين المشتقات المكانية (Edge Variance)
 */
export function calculateBlurScore(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    // نستخدم عينة سريعة 64x64 في منتصف الكادر لحساب فائق السرعة (< 5ms)
    const sampleSize = 64;
    const startX = Math.max(0, Math.floor((width - sampleSize) / 2));
    const startY = Math.max(0, Math.floor((height - sampleSize) / 2));
    const imgData = ctx.getImageData(startX, startY, sampleSize, sampleSize);
    const data = imgData.data;

    // تحويل إلى مصفوفة تدرج رمادي (Grayscale)
    const gray = new Float32Array(sampleSize * sampleSize);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // تطبيق فلتر لابلاسيان لحساب تباين الحواف (Laplacian Filter)
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let y = 1; y < sampleSize - 1; y++) {
      for (let x = 1; x < sampleSize - 1; x++) {
        const idx = y * sampleSize + x;
        // Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
        const lap =
          gray[idx - sampleSize] +
          gray[idx + sampleSize] +
          gray[idx - 1] +
          gray[idx + 1] -
          4 * gray[idx];

        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }

    if (count === 0) return 100;

    // التباين (Variance) يعبر عن وضوح الحواف
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    return variance;
  } catch {
    // في حال حدوث أي استثناء، نعتبر الصورة مقبولة لعدم تعطيل الكفيف
    return 100;
  }
}

let reusableCanvas: HTMLCanvasElement | null = null;
let reusableCtx: CanvasRenderingContext2D | null = null;

/**
 * المعالج الرئيسي للضغط التكيفي وفحص الاهتزاز في الوقت الحقيقي
 */
export function optimizeImageForTask(
  video: HTMLVideoElement,
  mode: string,
  checkBlur: boolean = true
): OptimizedImageResult | null {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const { maxDimension, quality } = getOptimizationConfig(mode);

  // حساب الأبعاد المحسنة مع الحفاظ الصارم على نسبة العرض للارتفاع
  let targetWidth = video.videoWidth;
  let targetHeight = video.videoHeight;

  if (targetWidth > targetHeight) {
    if (targetWidth > maxDimension) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    }
  } else {
    if (targetHeight > maxDimension) {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // إعادة استخدام الـ Canvas لتفادي الـ Garbage Collection وتسريب الذاكرة
  if (!reusableCanvas) {
    reusableCanvas = document.createElement("canvas");
  }
  reusableCanvas.width = targetWidth;
  reusableCanvas.height = targetHeight;

  if (!reusableCtx) {
    reusableCtx = reusableCanvas.getContext("2d", { willReadFrequently: true });
  }

  if (!reusableCtx) return null;

  // رسم وتنعيم الصورة
  reusableCtx.imageSmoothingEnabled = true;
  reusableCtx.imageSmoothingQuality = "high";
  reusableCtx.drawImage(video, 0, 0, targetWidth, targetHeight);

  // فحص الاهتزاز والضبابية
  let blurScore = 100;
  let isBlurred = false;

  if (checkBlur) {
    blurScore = calculateBlurScore(reusableCtx, targetWidth, targetHeight);
    // عتبة الاهتزاز: الصور المهزوزة بشدة تعطي تباين أقل من 12
    // نقوم بتطبيق الفحص الحازم فقط في نمط قراءة النصوص والمستندات
    const blurThreshold = mode === "read_text" || mode === "document" ? 14 : 7;
    isBlurred = blurScore < blurThreshold;
  }

  const base64 = reusableCanvas.toDataURL("image/jpeg", quality);

  return {
    base64,
    isBlurred,
    blurScore,
    width: targetWidth,
    height: targetHeight,
    mode,
  };
}
