"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Mic, AlertTriangle, ArrowRight, Home } from "lucide-react";
import { useA11y } from "@/components/GlobalA11yProvider";

export default function HowItWorksPage() {
  const router = useRouter();
  const { announce } = useA11y();

  useEffect(() => {
    announce("صفحة كيف يعمل نور دهب. يشرح هذا القسم كيفية استخدام الرؤية الاصطناعية، التنقل الصوتي، ونظام الطوارئ.");
  }, [announce]);

  const handleBack = () => {
    announce("العودة إلى الصفحة الرئيسية.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-400 p-3.5 sm:p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 sm:mb-8 pb-2 border-b border-gray-800">
        <h1 className="text-xl sm:text-3xl font-black text-amber-400">كيف يعمل نور دهب</h1>
        <button
          onClick={handleBack}
          aria-label="العودة إلى الصفحة الرئيسية - العودة لاستخدام التطبيق"
          className="p-2 sm:p-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full focus:ring-4 focus:ring-amber-400 active:scale-95 transition-all"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 space-y-4 sm:space-y-6">
        {/* AI Vision Section */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Eye className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">الرؤية الاصطناعية بالكاميرا</h2>
          </div>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            المس الشاشة في أي مكان لتصوير ما أمامك والحصول على وصف صوتي فوري. النظام يستخدم الذكاء الاصطناعي لتحليل الصور ووصفها باللغة العربية المصرية.
          </p>
          <ul className="space-y-2 text-white text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>المس الشاشة مرة واحدة للوصف العام للمشهد</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>اضغط مطولاً للتحدث وسؤال الذكاء الاصطناعي بصوتك</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>يمكنك استخدام أزرار الصوت في الموبايل للتصوير الفوري</span>
            </li>
          </ul>
        </section>

        {/* Voice Navigation Section */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Mic className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">التنقل الصوتي والأوامر</h2>
          </div>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            يمكنك التحدث مع التطبيق باللغة العربية وطلب المساعدة في أي وقت. النظام يفهم الأوامر الصوتية ويستجيب فوراً.
          </p>
          <ul className="space-y-2 text-white text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>قل "شوف قدامي" للوصف الفوري للمكان</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>قل "أنا فين" لسماع اسم الشارع والموقع الحالي</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>قل "كشاف" لتشغيل أو إطفاء كشاف الكاميرا</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>قل "ساعدني" للاستماع إلى دليل الأوامر الصوتية الكامل</span>
            </li>
          </ul>
        </section>

        {/* SOS Section */}
        <section className="bg-slate-900 border border-red-500/70 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-red-500 rounded-full">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-red-400">نظام الطوارئ SOS</h2>
          </div>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            زر الطوارئ الأحمر الكبير يرسل موقعك الحالي ورابط تتبع مباشر لجهة الطوارئ عبر واتساب أو الاتصال المباشر.
          </p>
          <ul className="space-y-2 text-white text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>اضغط على زر الطوارئ الأحمر في أعلى الشاشة</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>أو انقر 4 نقرات سريعة في أي مكان على الشاشة لاستغاثة فورية</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
