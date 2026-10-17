"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Download, Smartphone, ArrowRight, ShieldCheck, Zap, RefreshCw, Volume2 } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useInstantSpeech } from "@/hooks/useInstantSpeech";

export default function DownloadAppPage() {
  const { speak } = useSpeech();
  const { playClickSound } = useInstantSpeech();

  useEffect(() => {
    speak("صفحة تحميل وتثبيت تطبيق نور دهب الرسمي لهواتف الأندرويد. اضغط على الزر الكبير لتحميل ملف الـ APK المباشر.");
  }, [speak]);

  return (
    <main className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between pb-4 border-b border-gray-800">
        <Link
          href="/"
          onClick={playClickSound}
          className="flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors bg-dark-800 px-3 py-2 rounded-xl border border-amber-500/30"
          aria-label="الرجوع إلى التطبيق الرئيسي"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع للتطبيق</span>
        </Link>
        <span className="text-xs text-gray-400 font-bold">Dahab Software</span>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-lg my-auto py-6 flex flex-col items-center text-center">
        {/* App Icon */}
        <div className="w-24 h-24 mb-4 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl p-1 shadow-2xl flex items-center justify-center border-2 border-amber-300">
          <Smartphone className="w-12 h-12 text-dark-900 stroke-[2.5]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          تطبيق نور دهب الرسمي
        </h1>
        <p className="text-sm text-amber-300 font-bold mb-6">
          نسخة أندرويد المستقلة (APK v2.0)
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-6 text-right">
          <div className="bg-dark-800/80 p-3 rounded-2xl border border-gray-800 flex items-start gap-2.5">
            <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-white">تحديث تلقائي مستمر</p>
              <p className="text-[10px] text-gray-400">يتصل بالخادم الحي ويتحدث تلقائياً مع كل تطوير</p>
            </div>
          </div>

          <div className="bg-dark-800/80 p-3 rounded-2xl border border-gray-800 flex items-start gap-2.5">
            <Volume2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-white">صوت ثلاثي الأبعاد 3D</p>
              <p className="text-[10px] text-gray-400">توجيه صوتي في الأذن اليمنى أو اليسرى</p>
            </div>
          </div>

          <div className="bg-dark-800/80 p-3 rounded-2xl border border-gray-800 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-white">كاشف السقوط الآلي</p>
              <p className="text-[10px] text-gray-400">حساسات السقوط والطوارئ الفورية للولي</p>
            </div>
          </div>

          <div className="bg-dark-800/80 p-3 rounded-2xl border border-gray-800 flex items-start gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-white">خصوصية 100%</p>
              <p className="text-[10px] text-gray-400">معالجة وتخزين محلي معزول داخل هاتفك</p>
            </div>
          </div>
        </div>

        {/* Big Download Button */}
        <a
          href="/api/download/apk"
          download="NoorDahab.apk"
          onClick={() => {
            playClickSound();
            speak("جارٍ بدء تحميل ملف تطبيق نور دهب أندرويد APK الآن.");
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 active:scale-95 text-dark-900 text-base font-black rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all border-2 border-amber-300 cursor-pointer"
          aria-label="تحميل ملف تطبيق نور دهب أندرويد APK مباشرة"
        >
          <Download className="w-6 h-6 stroke-[3]" />
          <span>تحميل ملف APK المباشر للأندرويد</span>
        </a>

        <p className="text-[11px] text-gray-400 mt-3">
          (حجم الملف خفيف وسريع، متوافق مع كافة هواتف أندرويد 8.0 فما فوق)
        </p>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-lg text-center pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 font-medium">
          ابتكار وبرمجة المهندس إسلام أبو دهب • Dahab Software
        </p>
      </footer>
    </main>
  );
}
