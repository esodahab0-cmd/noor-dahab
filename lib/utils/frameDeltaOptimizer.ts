/**
 * Visual Frame Delta Optimizer & Smart Throttle
 * 
 * وحدة كبح الإطارات المكررة وحساب نسبة التغير البصري (Pixel Delta)
 * لتوفير 70% من طاقة البطارية والبيانات في وضع السير المستمر والستار المظلم.
 */

let lastFrameSample: Float32Array | null = null;
let sampleCanvas: HTMLCanvasElement | null = null;
let sampleCtx: CanvasRenderingContext2D | null = null;

const SAMPLE_SIZE = 48; // عينة سريعة 48x48 كافية جداً لفحص التغير بأقل من 3ms

/**
 * حساب نسبة التغير بين الكادر الحالي والكادر السابق
 * @returns نسبة مئوية من 0 إلى 100
 */
export function calculateFrameDeltaPercentage(video: HTMLVideoElement): number {
  if (!video || video.videoWidth === 0 || video.readyState < 2) return 100;

  try {
    if (!sampleCanvas) {
      sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = SAMPLE_SIZE;
      sampleCanvas.height = SAMPLE_SIZE;
      sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    }

    if (!sampleCtx) return 100;

    sampleCtx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const imgData = sampleCtx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

    // استخراج سطوع الرمادي
    const currentSample = new Float32Array(SAMPLE_SIZE * SAMPLE_SIZE);
    for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
      currentSample[j] = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    }

    if (!lastFrameSample) {
      lastFrameSample = currentSample;
      return 100; // أول كادر يعتبر تغيراً كاملاً
    }

    // حساب متوسط الفرق المطلق (Mean Absolute Difference)
    let totalDiff = 0;
    for (let i = 0; i < currentSample.length; i++) {
      totalDiff += Math.abs(currentSample[i] - lastFrameSample[i]);
    }

    lastFrameSample = currentSample;

    const maxPossibleDiff = currentSample.length * 255;
    const deltaPercent = (totalDiff / maxPossibleDiff) * 100;

    return Math.round(deltaPercent * 10) / 10;
  } catch {
    return 100;
  }
}

/**
 * فحص ما إذا كان الكادر يستحق الإرسال للـ AI
 * @param threshold الحد الأدنى للتغير (الافتراضي 12%)
 */
export function shouldSendFrameToAI(video: HTMLVideoElement, threshold: number = 12): boolean {
  const delta = calculateFrameDeltaPercentage(video);
  // إذا كان التغير أعلى من العتبة نرسله، وإلا فهو مشهد ثابت مكرر
  return delta >= threshold;
}
