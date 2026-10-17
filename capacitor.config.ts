import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.dahabsoftware.noordahab",
  appName: "نور دهب",
  webDir: "public",
  server: {
    // قراءة التطبيق مباشرة من الموقع الحي لضمان التحديث التلقائي الفوري لجميع الهواتف
    url: "https://dahabsoftware.online",
    cleartext: true,
    allowNavigation: [
      "dahabsoftware.online",
      "*.google.com",
      "wa.me"
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
