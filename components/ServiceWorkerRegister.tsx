"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("Service Worker registered successfully:", reg.scope);
          // تحقق فوري من وجود تحديث جديد فور تشغيل التطبيق
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}