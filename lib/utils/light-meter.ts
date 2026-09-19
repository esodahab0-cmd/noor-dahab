/**
 * Acoustic Light & Darkness Meter Engine (كاشف النور بالرنين الصوتي)
 * Translates visual ambient brightness into a dynamic audio tone frequency using Web Audio API.
 * High pitch = bright light / sun / lamp
 * Low pitch / silence = deep darkness / lamp off
 */

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let samplingTimer: any = null;
let isRunning = false;
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

export function isLightMeterActive(): boolean {
  return isRunning;
}

export function getLightDescription(luminance0to1: number): string {
  if (luminance0to1 < 0.06) {
    return "ظلام تام (النور مطفي تماماً)";
  }
  if (luminance0to1 < 0.25) {
    return "إضاءة خافتة جداً أو نور ضعيف";
  }
  if (luminance0to1 < 0.55) {
    return "إضاءة متوسطة عادية";
  }
  if (luminance0to1 < 0.8) {
    return "إضاءة جيدة وساطعة";
  }
  return "إضاءة قوية جداً (كشاف مباشر أو شمس)";
}

export function startLightMeter(
  videoElement: HTMLVideoElement,
  onBrightness?: (luminance: number, description: string) => void
): boolean {
  if (typeof window === "undefined") return false;
  if (isRunning) return true;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return false;

    audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    // Warm, non-fatiguing sine wave
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);

    // Initial soft volume
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    // Offscreen canvas for micro-sampling (24x24 pixels is ultra lightweight ~0% CPU)
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = 24;
      offscreenCanvas.height = 24;
      offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
    }

    isRunning = true;

    // Sample brightness 12 times per second (smooth audio responsiveness)
    samplingTimer = setInterval(() => {
      if (!videoElement || videoElement.readyState < 2 || !offscreenCtx || !audioCtx || !oscillator || !gainNode) {
        return;
      }

      try {
        offscreenCtx.drawImage(videoElement, 0, 0, 24, 24);
        const imgData = offscreenCtx.getImageData(0, 0, 24, 24).data;
        let totalLuminance = 0;
        const totalPixels = 24 * 24;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          // Standard ITU-R BT.601 perceptual luminance
          totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
        }

        const avgLuminance = totalLuminance / totalPixels; // 0 to 255
        const norm = Math.max(0, Math.min(1, avgLuminance / 255)); // 0.0 to 1.0

        const now = audioCtx.currentTime;

        if (norm < 0.04) {
          // Total darkness: fade out to silence
          gainNode.gain.setTargetAtTime(0.0001, now, 0.05);
          oscillator.frequency.setTargetAtTime(160, now, 0.05);
        } else {
          // Dynamic pitch: 180 Hz up to 1250 Hz (musical scale from F3 to D#6)
          const targetFreq = 180 + Math.pow(norm, 1.25) * 1070;
          const targetGain = Math.min(0.07, 0.015 + norm * 0.05);

          oscillator.frequency.setTargetAtTime(targetFreq, now, 0.04);
          gainNode.gain.setTargetAtTime(targetGain, now, 0.04);
        }

        if (onBrightness) {
          onBrightness(norm, getLightDescription(norm));
        }
      } catch (err) {
        // Silent catch for video frame grab issues
      }
    }, 85);

    return true;
  } catch (err) {
    console.error("Failed to start light meter:", err);
    stopLightMeter();
    return false;
  }
}

export function stopLightMeter(): void {
  isRunning = false;
  if (samplingTimer) {
    clearInterval(samplingTimer);
    samplingTimer = null;
  }

  if (gainNode && audioCtx) {
    try {
      gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
    } catch {}
  }

  setTimeout(() => {
    try {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
      }
      if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    } catch {}
  }, 50);
}
