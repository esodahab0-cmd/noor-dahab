/**
/**
 * 3D Spatial Audio & Directional Radar Engine (الرادار الصوتي المجسم ثلاثي الأبعاد)
 * Noor Dahab - Dahab Software
 * 
 * Plays directional stereo-panned sound cues in earbuds (left/center/right)
 * so the blind user instinctively perceives obstacle location and clear pathways
 * before/during spoken speech.
 * 
 * 100% On-Device & Zero Latency Web Audio API.
 */

let spatialAudioCtx: AudioContext | null = null;

export function getSpatialAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!spatialAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      spatialAudioCtx = new AudioContextClass();
    }
  }
  if (spatialAudioCtx && spatialAudioCtx.state === "suspended") {
    spatialAudioCtx.resume().catch(() => {});
  }
  return spatialAudioCtx;
}

export function calculatePanFromX(x0to1: number): number {
  // Screen center is 0.5. Left is 0.0 -> pan = -1.0. Right is 1.0 -> pan = +1.0
  const clamped = Math.max(0, Math.min(1, x0to1));
  return (clamped - 0.5) * 2; // -1.0 to +1.0
}

export type DirectionType = "left" | "right" | "center" | "none";
export type SeverityType = "danger" | "warning" | "clear" | "info";

export interface SpatialAnalysisResult {
  pan: number; // -1 (full left) to +1 (full right)
  direction: DirectionType;
  severity: SeverityType;
  hasDirectionalCue: boolean;
}

/**
 * Parses natural Egyptian Arabic spoken guidance to detect direction & severity
 */
export function detectDirectionAndSeverity(text: string): SpatialAnalysisResult {
  if (!text) {
    return { pan: 0, direction: "none", severity: "info", hasDirectionalCue: false };
  }

  const clean = text.toLowerCase();

  // 1. Detection of direction
  let direction: DirectionType = "none";
  let pan = 0;

  const rightRegex = /يمينك|على اليمين|عاليمين|ناحية اليمين|اتجاه اليمين|انحرف يمين|حود يمين|كسر يمين|على إيدك اليمين|على ايدك اليمين/;
  const leftRegex = /شمالك|على الشمال|عالشمال|يسارك|على اليسار|ناحية الشمال|ناحية اليسار|انحرف شمال|حود شمال|كسر شمال|على إيدك الشمال|على ايدك الشمال/;
  const centerRegex = /قدامك|أمامك|امامك|في وشك|في وجهك|مواجه ليك|في مسارك|طريقك/;

  if (rightRegex.test(clean) && !leftRegex.test(clean)) {
    direction = "right";
    pan = 0.9;
  } else if (leftRegex.test(clean) && !rightRegex.test(clean)) {
    direction = "left";
    pan = -0.9;
  } else if (centerRegex.test(clean)) {
    direction = "center";
    pan = 0;
  }

  // 2. Detection of severity
  let severity: SeverityType = "info";

  const dangerRegex = /خطر|احذر|حاسب|انتبه|حفرة|بلاعة|عربية|سيارة|موتوسيكل|عجلة|توكتوك|سلم نازل|درج هابط|سقوط|ممنوع المشي|قف|أقف|اقف/;
  const warningRegex = /عائق|عمود|شجرة|كرسي|ترابيزة|صندوق|رصيف|حائط|جدار|انحرف|تفادى|تفادي|حاجة قدامك/;
  const clearRegex = /سالك|فاضي|طريقك سالك|طريقك مفتوح|أمان|طمن|طريق سالك|فاضية|تمام كمل|مفيش عوائق|امشي بأمان/;

  if (dangerRegex.test(clean)) {
    severity = "danger";
  } else if (warningRegex.test(clean)) {
    severity = "warning";
  } else if (clearRegex.test(clean)) {
    severity = "clear";
  }

  const hasDirectionalCue = direction !== "none" || severity !== "info";

  return { pan, direction, severity, hasDirectionalCue };
}

/**
 * Plays a directional sound cue (in right or left earbud)
 */
export function playSpatialHazardBeep(
  pan = 0, // -1.0 (left) to +1.0 (right)
  severity: SeverityType = "warning"
): void {
  const ctx = getSpatialAudioContext();
  if (!ctx) return;

  try {
    const clampedPan = Math.max(-1, Math.min(1, pan));

    // Handle "clear" pleasant harmonic chime
    if (severity === "clear") {
      playCalmClearChime(ctx, clampedPan);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let panner: StereoPannerNode | null = null;
    if ("createStereoPanner" in ctx) {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(clampedPan, ctx.currentTime);
    }

    const baseFreq = severity === "danger" ? 920 : severity === "warning" ? 640 : 520;
    const duration = severity === "danger" ? 0.09 : severity === "warning" ? 0.12 : 0.14;
    const volume = severity === "danger" ? 0.22 : 0.14;

    osc.type = severity === "danger" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    if (panner) {
      osc.connect(panner);
      panner.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);

    // Danger triggers immediate second alert pulse in same ear
    if (severity === "danger") {
      setTimeout(() => {
        if (!ctx) return;
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          let panner2: StereoPannerNode | null = null;
          if ("createStereoPanner" in ctx) {
            panner2 = ctx.createStereoPanner();
            panner2.pan.setValueAtTime(clampedPan, ctx.currentTime);
          }
          osc2.type = "sawtooth";
          osc2.frequency.setValueAtTime(baseFreq * 1.2, ctx.currentTime);
          gain2.gain.setValueAtTime(0.001, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          if (panner2) {
            osc2.connect(panner2);
            panner2.connect(gain2);
          } else {
            osc2.connect(gain2);
          }
          gain2.connect(ctx.destination);

          osc2.start();
          osc2.stop(ctx.currentTime + 0.1);
        } catch {}
      }, 100);
    }
  } catch (err) {
    console.warn("Spatial audio error:", err);
  }
}

/**
 * Plays a soft, calming dual-tone chime when path is clear
 */
function playCalmClearChime(ctx: AudioContext, pan: number): void {
  try {
    const freqs = [523.25, 659.25]; // C5 to E5 pleasant harmony
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          let panner: StereoPannerNode | null = null;
          if ("createStereoPanner" in ctx) {
            panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(pan, ctx.currentTime);
          }
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

          if (panner) {
            osc.connect(panner);
            panner.connect(gain);
          } else {
            osc.connect(gain);
          }
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } catch {}
      }, idx * 70);
    });
  } catch {}
}

/**
 * Instant helper: inspects text and fires the corresponding 3D directional sound
 */
export function playDirectionalCueFromText(text: string): SpatialAnalysisResult {
  const analysis = detectDirectionAndSeverity(text);
  if (analysis.hasDirectionalCue) {
    playSpatialHazardBeep(analysis.pan, analysis.severity);
  }
  return analysis;
}
