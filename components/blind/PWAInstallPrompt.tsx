"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Smartphone, Share2, PlusSquare, ExternalLink, X, CheckCircle2 } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useInstantSpeech } from "@/hooks/useInstantSpeech";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showInAppModal, setShowInAppModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const { speak } = useSpeech();
  const { playClickSound } = useInstantSpeech();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    // 1. تحقق من وضع التثبيت (هل التطبيق مفتوح بالفعل كـ PWA مستقل؟)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);

    // 2. كشف نظام iOS و In-App Browsers
    const ua = window.navigator.userAgent || "";
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line|Messenger|Snapchat/i.test(ua);
    setIsIOS(isAppleDevice);
    setIsInAppBrowser(inApp);

    // 3. التقاط الـ Prompt المحفوظ مسبقاً في head إن وُجد
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    // 4. الاستماع لحدث جاهزية الـ Prompt
    const handlePromptReady = () => {
      if ((window as any).__pwaInstallPrompt) {
        setDeferredPrompt((window as any).__pwaInstallPrompt);
      }
    };

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccess(true);
      speak("تم تثبيت تطبيق نور دهب على هاتفك بنجاح. ستجده الآن في شاشتك الرئيسية.");
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener("pwa-prompt-ready", handlePromptReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. الاستماع لأمر التثبيت الصوتي من أي مكان في التطبيق
    const handleVoiceTrigger = () => {
      handleInstallClick();
    };
    window.addEventListener("trigger-pwa-install", handleVoiceTrigger);

    return () => {
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleVoiceTrigger);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    playClickSound();

    // حالة 1: داخل متصفح تطبيقات (واتساب / فيسبوك / إنستغرام)
    if (isInAppBrowser) {
      setShowInAppModal(true);
      speak("لتثبيت التطبيق بنقرة واحدة، يجب فتحه في متصفح جوجل كروم. اضغط على زر فتح في كروم.");
      return;
    }

    // حالة 2: أجهزة آبل (آيفون / آيباد)
    if (isIOS) {
      setShowIOSModal(true);
      speak("على أجهزة آيفون: اضغط على زر المشاركة أسفل الشاشة، ثم اختر إضافة إلى الصفحة الرئيسية.");
      return;
    }

    // حالة 3: أندرويد وكروم (تثبيت فوري بنقرة واحدة بدون أي قوائم)
    const activePrompt = deferredPrompt || (window as any).__pwaInstallPrompt;

    if (activePrompt) {
      try {
        speak("جاري فتح نافذة التثبيت المباشر على هاتفك الآن.");
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === "accepted") {
          speak("تم تثبيت نور دهب بنجاح على هاتفك.");
          (window as any).__pwaInstallPrompt = null;
          setDeferredPrompt(null);
        } else {
          speak("تم إلغاء التثبيت.");
        }
      } catch (err) {
        console.warn("PWA Prompt error:", err);
        speak("اضغط على زر تثبيت الظاهر أمامك على الشاشة لتأكيد التثبيت.");
      }
    } else {
      // محاولة استدعاء تلقائي في حال كان المتصفح يدعم ذلك أو عرض إشعار سريع
      speak("جاري فحص جاهزية التثبيت المباشر. اضغط مرة أخرى للتأكيد.");
    }
  }, [deferredPrompt, isInAppBrowser, isIOS, playClickSound, speak]);

  const openInChromeIntent = () => {
    playClickSound();
    const currentUrl = window.location.href.replace(/^https?:\/\//, "");
    // Android Chrome Intent لفتح الرابط مباشرة في متصفح كروم الأصلي
    window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  if (!mounted || isStandalone) return null;

  return (
    <>
      {/* البانر الرئيسي السريع في أعلى التطبيق */}
      <div className="relative z-30 mx-3 mb-2 p-2.5 bg-gradient-to-r from-amber-500/20 via-dark-800 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md animate-pulse-subtle">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-dark-900 rounded-xl shadow-md">
            <Smartphone className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black text-amber-300">تثبيت نور دهب على الهاتف</p>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded border border-amber-400/40">
                نقرة واحدة
              </span>
            </div>
            <p className="text-[10px] text-gray-300 font-medium">يعمل كتطبيق أصلي سريع بدون متصفح</p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-dark-900 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-400/50"
          aria-label="تثبيت تطبيق نور دهب مباشرة على هاتفك بنقرة واحدة"
        >
          <Download className="w-4 h-4 stroke-[3]" />
          <span>تثبيت الآن</span>
        </button>
      </div>

      {/* نافذة إرشاد التثبيت على آيفون (iOS) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-dark-900 border-2 border-amber-400/80 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white bg-dark-800 rounded-full"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/50">
              <Smartphone className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-base font-black text-white mb-2">تثبيت نور دهب على الآيفون</h3>
            <p className="text-xs text-gray-300 mb-4">
              نظام آبل لا يدعم زر التثبيت التلقائي، يمكنك تثبيته في خطوتين فقط:
            </p>

            <div className="space-y-2.5 text-right bg-dark-800/80 p-3 rounded-2xl border border-gray-700 text-xs text-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>1. اضغط على زر <strong>المشاركة</strong> أسفل متصفح سفاري</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <span>2. اختر <strong>إضافة إلى الشاشة الرئيسية</strong></span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-dark-900 font-black rounded-xl text-xs transition-all"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}

      {/* نافذة التحويل لمتصفح كروم عند الفتح من واتساب أو فيسبوك */}
      {showInAppModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-dark-900 border-2 border-amber-400/80 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowInAppModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white bg-dark-800 rounded-full"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/50">
              <ExternalLink className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-base font-black text-white mb-2">تثبيت التطبيق بنقرة واحدة</h3>
            <p className="text-xs text-gray-300 mb-4">
              أنت تفتح الرابط من داخل تطبيق آخر. للتثبيت المباشر على الهاتف افتحه في متصفح كروم:
            </p>

            <button
              onClick={openInChromeIntent}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-dark-900 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg mb-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح في جوجل كروم للتثبيت الفوري</span>
            </button>

            <button
              onClick={() => setShowInAppModal(false)}
              className="w-full py-2 bg-dark-800 text-gray-400 hover:text-white font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* إشعار النجاح */}
      {installedSuccess && (
        <div className="fixed top-4 inset-x-4 z-50 bg-emerald-500 text-white p-3 rounded-2xl flex items-center justify-center gap-2 shadow-2xl text-xs font-black">
          <CheckCircle2 className="w-5 h-5" />
          <span>تم تثبيت تطبيق نور دهب على هاتفك بنجاح!</span>
        </div>
      )}
    </>
  );
}