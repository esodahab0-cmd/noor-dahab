"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          speak("تم تثبيت تطبيق نور دهب بنجاح.");
          setDeferredPrompt(null);
        }
      } catch (err) {
        speak("يرجى فتح قائمة المتصفح واختيار إضافة إلى الشاشة الرئيسية.");
      }
    } else {
      speak("جاري تثبيت التطبيق. يرجى اختيار إضافة إلى الشاشة الرئيسية من قائمة المتصفح.");
    }
  };

  if (!mounted || isStandalone) return null;

  return (
    <div className="relative z-30 mx-3 mb-2 p-2.5 bg-gradient-to-r from-gold-500/25 via-dark-800 to-gold-500/25 border border-gold-500/60 rounded-2xl flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gold-500 text-dark-900 rounded-xl">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-black text-gold-300">تثبيت نور دهب على الهاتف</p>
          <p className="text-[10px] text-gray-400">تطبيق أصلي سريع وشاشة كاملة</p>
        </div>
      </div>

      <button
        onClick={handleInstallClick}
        className="px-4 py-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        تثبيت
      </button>
    </div>
  );
}