/**
 * Autonomous Fall & Impact Detection Engine (محرك اكتشاف السقوط التلقائي)
 * Noor Dahab - Dahab Software
 * 
 * Monitors device accelerometer to detect sudden falls, heavy impacts, and subsequent immobility.
 * 100% On-Device & Zero Latency.
 */

export interface FallDetectorOptions {
  onFallDetected: () => void;
  enabled?: boolean;
}

class FallDetector {
  private isListening = false;
  private onFallCallback: (() => void) | null = null;

  // State machine for fall detection
  private stage: "IDLE" | "FREE_FALL" | "IMPACT_DETECTED" = "IDLE";
  private freeFallTime = 0;
  private impactTime = 0;
  private postImpactSamples: number[] = [];

  // Thresholds (in m/s^2, 1G ~= 9.8)
  private readonly FREE_FALL_THRESHOLD = 3.2; // Near zero gravity
  private readonly IMPACT_THRESHOLD = 24.0;   // Hard impact spike
  private readonly IMMOBILE_THRESHOLD = 2.5;  // Low movement variance
  private readonly FREE_FALL_MAX_DURATION = 800; // ms between free-fall and impact

  public init(callback: () => void): () => void {
    this.onFallCallback = callback;
    this.start();
    return () => this.stop();
  }

  public start(): void {
    if (this.isListening || typeof window === "undefined") return;

    if ("DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", this.handleMotion, { passive: true });
      this.isListening = true;
    }
  }

  public stop(): void {
    if (!this.isListening || typeof window === "undefined") return;

    window.removeEventListener("devicemotion", this.handleMotion);
    this.isListening = false;
    this.resetState();
  }

  private resetState(): void {
    this.stage = "IDLE";
    this.freeFallTime = 0;
    this.impactTime = 0;
    this.postImpactSamples = [];
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const x = acc.x;
    const y = acc.y;
    const z = acc.z;

    // Vector magnitude = sqrt(x^2 + y^2 + z^2)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    switch (this.stage) {
      case "IDLE":
        // المرحلة 1: انخفاض الجاذبية المفاجئ (انعدام وزن / بداية سقوط)
        if (magnitude < this.FREE_FALL_THRESHOLD) {
          this.stage = "FREE_FALL";
          this.freeFallTime = now;
        }
        break;

      case "FREE_FALL":
        // المرحلة 2: ارتطام شديد بالأرض
        if (magnitude > this.IMPACT_THRESHOLD) {
          const timeSinceFreeFall = now - this.freeFallTime;
          if (timeSinceFreeFall <= this.FREE_FALL_MAX_DURATION) {
            this.stage = "IMPACT_DETECTED";
            this.impactTime = now;
            this.postImpactSamples = [];
          } else {
            this.resetState();
          }
        } else if (now - this.freeFallTime > this.FREE_FALL_MAX_DURATION) {
          // لم يحدث ارتطام في الوقت المتوقع (ربما تحرك عادي باليد)
          this.resetState();
        }
        break;

      case "IMPACT_DETECTED":
        // المرحلة 3: فحص السكون التام بعد الارتطام
        this.postImpactSamples.push(magnitude);

        // جمع عينات لمدة ثانيتين بعد الارتطام للتأكد من عدم وجود حركة طبيعية
        if (now - this.impactTime >= 1800) {
          const variance = this.calculateVariance(this.postImpactSamples);

          if (variance < this.IMMOBILE_THRESHOLD) {
            // تحقق السقوط الحقيقي مع سكون الهاتف!
            this.triggerFallAlert();
          }

          this.resetState();
        }
        break;
    }
  };

  private calculateVariance(samples: number[]): number {
    if (samples.length === 0) return 0;
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const squaredDiffs = samples.map((val) => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / samples.length);
  }

  private triggerFallAlert(): void {
    if (this.onFallCallback) {
      this.onFallCallback();
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("autonomous-fall-detected"));
    }
  }
}

export const globalFallDetector = new FallDetector();
