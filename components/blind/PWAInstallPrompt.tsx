"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    // Check if app is already running as installed standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

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
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          speak("تم تثبيت تطبيق نور دهب على هاتفك بنجاح.");
          setDeferredPrompt(null);
        }
      } catch (e) {
        setShowHelpModal(true);
      }
    } else {
      setShowHelpModal(true);
      if (isIOS) {
        speak("لتثبيت نور دهب على آيفون: اضغط زر المشاركة أسفل الشاشة، ثم اختر إضافة إلى الشاشة الرئيسية.");
      } else {
        speak("لتثبيت التطبيق: اضغط على الثلاث نقاط أعلى المتصفح، ثم اختر تثبيت التطبيق.");
      }
    }
  };

  // Prevent any hydration mismatch
  if (!mounted || isStandalone) return null;

  return (
    <>
      <div className="relative z-30 mx-3 mb-2 p-2.5 bg-gradient-to-r from-gold-500/25 via-dark-800 to-gold-500/25 border border-gold-500/60 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gold-500 text-dark-900 rounded-xl">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-gold-300">تثبيت نور دهب على الهاتف</p>
            <p className="text-[10px] text-gray-400">ليعمل كتطبيق أصلي سريع وشاشة كاملة</p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          تثبيت الآن
        </button>
      </div>

      {/* Help Modal if native prompt is not directly supported */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-800 border-2 border-gold-500/50 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-14 h-14 mx-auto bg-gold-500/20 text-gold-400 rounded-full flex items-center justify-center">
              <Download className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-white">طريقة تثبيت نور دهب على هاتفك</h3>

            {isIOS ? (
              <div className="text-sm text-gray-300 space-y-2 text-right bg-dark-700/60 p-4 rounded-2xl border border-gray-700">
                <p className="font-bold text-gold-300">لهواتف iPhone (متصفح Safari):</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-300">
                  <li>اضغط على أيقونة <strong>المشاركة (Share)</strong> أسفل الشاشة.</li>
                  <li>انزل لأسفل واختر <strong>(إضافة إلى الشاشة الرئيسية / Add to Home Screen)</strong>.</li>
                  <li>اضغط <strong>(إضافة / Add)</strong> أعلى يمين الشاشة.</li>
                </ol>
              </div>
            ) : (
              <div className="text-sm text-gray-300 space-y-2 text-right bg-dark-700/60 p-4 rounded-2xl border border-gray-700">
                <p className="font-bold text-gold-300">لهواتف Android (متصفح Chrome):</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-300">
                  <li>اضغط على <strong>قائمة الثلاث نقاط (⋮)</strong> في أعلى يمين المتصفح.</li>
                  <li>اختر <strong>(تثبيت التطبيق / Install App)</strong> أو (إضافة إلى الشاشة الرئيسية).</li>
                  <li>اضغط <strong>(تثبيت / Install)</strong>.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-dark-900 font-black rounded-xl text-sm"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
}