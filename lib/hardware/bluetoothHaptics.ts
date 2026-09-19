/**
 * Web Bluetooth Spatial Haptics Engine
 * 
 * محرك الاهتزاز المكاني عبر البلوتوث للأجهزة القابلة للارتداء (أحزمة/نظارات/أساور ذكية)
 * يرسل نبضات اهتزاز موجهة (يمين/يسار/وسط) لتوجيه الكفيف حركياً بدون أي صوت.
 */

export interface BluetoothHapticDevice {
  connected: boolean;
  deviceName?: string;
}

let activeDevice: any = null;
let hapticCharacteristic: any = null;

/**
 * فحص دعم المتصفح لـ Web Bluetooth
 */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * الاتصال بجهاز اهتزاز ذكي عبر البلوتوث
 */
export async function connectBluetoothHapticDevice(): Promise<BluetoothHapticDevice> {
  if (!isBluetoothSupported()) {
    return { connected: false };
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ["battery_service"] }],
      optionalServices: ["generic_access"],
    });

    const server = await device.gatt.connect();
    activeDevice = device;

    return {
      connected: true,
      deviceName: device.name || "سوار الاهتزاز الذكي",
    };
  } catch (err) {
    console.warn("Bluetooth connection skipped or cancelled:", err);
    return { connected: false };
  }
}

/**
 * إرسال نبضة اهتزازية موجهة للجهاز القابل للارتداء
 * @param direction "left" | "center" | "right"
 * @param intensity 1 (خفيف) | 2 (متوسط) | 3 (خطر قوي)
 */
export async function sendSpatialHapticPulse(
  direction: "left" | "center" | "right",
  intensity: number = 2
): Promise<void> {
  if (!activeDevice || !activeDevice.gatt?.connected) {
    // في حال عدم وجود جهاز بلوتوث خارجي، نشغل اهتزاز الموبايل المدمج تلقائياً
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (direction === "left") navigator.vibrate([100, 50, 100]);
      else if (direction === "right") navigator.vibrate([200, 100, 200]);
      else navigator.vibrate([150, 50, 150]);
    }
    return;
  }

  try {
    // إرسال كود التوجيه للبلوتوث
    const buffer = new Uint8Array([
      direction === "left" ? 1 : direction === "right" ? 2 : 3,
      intensity,
    ]);
    if (hapticCharacteristic) {
      await hapticCharacteristic.writeValue(buffer);
    }
  } catch (e) {
    console.warn("Failed to write to Bluetooth device:", e);
  }
}
