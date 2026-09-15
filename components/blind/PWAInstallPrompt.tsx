"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        speak("تم تثبيت تطبيق نور دهب على هاتفك بنجاح.");
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else if (isIOS) {
      speak("لتثبيت التطبيق على آيفون، اضغط على زر المشاركة أسفل الشاشة ثم اختر إضافة إلى الشاشة الرئيسية.");
      alert("على هواتف iPhone: اضغط على أيقونة المشاركة (Share) في Safari، ثم اختر (إضافة إلى الشاشة الرئيسية / Add to Home Screen).");
    }
  };

  if (isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <div className="relative z-30 mx-4 mb-2 p-3 bg-gradient-to-r from-gold-500/20 via-dark-800 to-gold-500/20 border-2 border-gold-400/60 rounded-2xl flex items-center justify-between shadow-xl">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-gold-500 text-dark-900 rounded-xl">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-black text-gold-300">تثبيت التطبيق على الموبايل</p>
          <p className="text-[10px] text-gray-400">ليعمل بكامل الشاشة وبدون متصفح</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 text-xs font-black rounded-xl shadow transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          تثبيت
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}