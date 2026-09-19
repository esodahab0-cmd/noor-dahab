/**
 * 3D Spatial Audio Radar Engine (الرادار المكاني ثلاثي الأبعاد)
 * Plays directional stereo-panned warning pulses in earbuds (left/center/right)
 * with frequency cadence matching obstacle proximity (like automotive parking sensors).
 */

let spatialAudioCtx: AudioContext | null = null;

function getSpatialAudioContext(): AudioContext | null {
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

export function playSpatialHazardBeep(
  pan = 0, // -1.0 (left) to +1.0 (right)
  severity: "danger" | "warning" | "caution" = "warning"
): void {
  const ctx = getSpatialAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Check StereoPannerNode support
    let panner: StereoPannerNode | null = null;
    if ("createStereoPanner" in ctx) {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
    }

    const baseFreq = severity === "danger" ? 880 : severity === "warning" ? 640 : 480;
    const duration = severity === "danger" ? 0.09 : severity === "warning" ? 0.12 : 0.15;
    const volume = severity === "danger" ? 0.18 : 0.12;

    osc.type = severity === "danger" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // Connect node chain
    if (panner) {
      osc.connect(panner);
      panner.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);

    // If danger, emit quick second pulse (double-click beep)
    if (severity === "danger") {
      setTimeout(() => {
        if (!ctx) return;
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          let panner2: StereoPannerNode | null = null;
          if ("createStereoPanner" in ctx) {
            panner2 = ctx.createStereoPanner();
            panner2.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
          }
          osc2.type = "sawtooth";
          osc2.frequency.setValueAtTime(baseFreq * 1.15, ctx.currentTime);
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
      }, 110);
    }
  } catch (err) {
    console.warn("Spatial audio error:", err);
  }
}
