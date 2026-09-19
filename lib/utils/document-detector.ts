/**
 * Document Frame Guidance Engine (مساعد مسح المستندات وتوجيه حواف الورقة)
 * Analyzes video feed to detect document/paper presence, framing, and alignment.
 * Gives immediate Arabic audio guidance to help blind users frame paper correctly.
 */

export interface DocumentGuidanceResult {
  status: "aligned" | "too_close" | "too_far" | "move_left" | "move_right" | "move_up" | "move_down" | "no_document";
  messageAr: string;
  isAligned: boolean;
  confidence: number;
}

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;
let alignedCounter = 0;

export function analyzeDocumentFraming(video: HTMLVideoElement): DocumentGuidanceResult {
  if (typeof window === "undefined" || !video || video.readyState < 2) {
    return { status: "no_document", messageAr: "الكاميرا غير جاهزة", isAligned: false, confidence: 0 };
  }

  // Create or reuse micro-canvas (120x90 is fast ~1ms CPU)
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = 120;
    offscreenCanvas.height = 90;
    offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  }

  if (!offscreenCtx) {
    return { status: "no_document", messageAr: "تعذر فحص الورقة", isAligned: false, confidence: 0 };
  }

  const W = 120;
  const H = 90;
  offscreenCtx.drawImage(video, 0, 0, W, H);
  const imgData = offscreenCtx.getImageData(0, 0, W, H).data;

  // 1. Calculate overall scene luminance and identify bright paper-like pixels
  let totalLum = 0;
  const lumMap: number[] = new Array(W * H);

  for (let i = 0; i < imgData.length; i += 4) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    lumMap[i / 4] = lum;
    totalLum += lum;
  }

  const avgLum = totalLum / (W * H);
  // Threshold for white/light paper against surface
  const paperThreshold = Math.max(120, avgLum + 25);

  // 2. Find bounding box of high-luminance (paper) area
  let minX = W, maxX = 0, minY = H, maxY = 0;
  let paperPixelCount = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (lumMap[idx] >= paperThreshold) {
        paperPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const totalPixels = W * H;
  const paperRatio = paperPixelCount / totalPixels;

  // If very few paper pixels, no clear document is visible
  if (paperPixelCount < totalPixels * 0.12) {
    alignedCounter = 0;
    return {
      status: "no_document",
      messageAr: "ضع الورقة أمام الكاميرا",
      isAligned: false,
      confidence: 0.2
    };
  }

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const boxArea = (boxWidth * boxHeight) / totalPixels;
  const centerX = (minX + maxX) / 2 / W;
  const centerY = (minY + maxY) / 2 / H;

  // 3. Guidance logic
  // Case A: Too close (paper covers entire screen or borders touch edges)
  if (paperRatio > 0.88 || (minX <= 2 && maxX >= W - 3 && minY <= 2 && maxY >= H - 3)) {
    alignedCounter = 0;
    return {
      status: "too_close",
      messageAr: "ارفع الموبايل لفوق شوية، الكاميرا قريبة جداً من الورقة",
      isAligned: false,
      confidence: 0.85
    };
  }

  // Case B: Too far
  if (boxArea < 0.22) {
    alignedCounter = 0;
    return {
      status: "too_far",
      messageAr: "قرب الموبايل من الورقة شوية",
      isAligned: false,
      confidence: 0.8
    };
  }

  // Case C: Horizontal displacement
  if (centerX < 0.36) {
    alignedCounter = 0;
    return {
      status: "move_left",
      messageAr: "حرك الموبايل للشمال شوية",
      isAligned: false,
      confidence: 0.75
    };
  }

  if (centerX > 0.64) {
    alignedCounter = 0;
    return {
      status: "move_right",
      messageAr: "حرك الموبايل لليمين شوية",
      isAligned: false,
      confidence: 0.75
    };
  }

  // Case D: Vertical displacement
  if (centerY < 0.35) {
    alignedCounter = 0;
    return {
      status: "move_up",
      messageAr: "نزل الموبايل لتحت شوية",
      isAligned: false,
      confidence: 0.75
    };
  }

  if (centerY > 0.65) {
    alignedCounter = 0;
    return {
      status: "move_down",
      messageAr: "ارفع الموبايل لفوق شوية",
      isAligned: false,
      confidence: 0.75
    };
  }

  // Case E: Perfectly aligned!
  alignedCounter++;
  const isSolidlyAligned = alignedCounter >= 2; // confirmed on at least 2 consecutive frames

  return {
    status: "aligned",
    messageAr: isSolidlyAligned ? "الورقة مظبوطة تماماً! ثابتين..." : "الورقة مظبوطة، اثبت مكانك",
    isAligned: isSolidlyAligned,
    confidence: 0.95
  };
}

export function resetDocumentGuidanceCounter(): void {
  alignedCounter = 0;
}
