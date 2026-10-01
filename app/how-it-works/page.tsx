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
    <div className="min-h-screen bg-slate-950 text-amber-400 p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-amber-400">كيف يعمل نور دهب</h1>
        <button
          onClick={handleBack}
          aria-label="العودة إلى الصفحة الرئيسية"
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full focus:ring-4 focus:ring-amber-400"
        >
          <Home className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 space-y-8">
        {/* AI Vision Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Eye className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">الرؤية الاصطناعية بالكاميرا</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            مس الشاشة في أي مكان لتصوير ما أمامك والحصول على وصف صوتي فوري. النظام يستخدم الذكاء الاصطناعي لتحليل الصور ووصفها باللغة العربية.
          </p>
          <ul className="space-y-2 text-white">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>مس الشاشة مرة واحدة للوصف العام</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>مس الشاشة مرتين سريعتين للتصوير الفوري</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>التحدث بصوتك لطلب تحليل محدد (قراءة نص، عد فلوس، إلخ)</span>
            </li>
          </ul>
        </section>

        {/* Voice Navigation Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Mic className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">التنقل الصوتي والأوامر</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            يمكنك التحدث مع التطبيق باللغة العربية وطلب المساعدة في أي وقت. النظام يفهم الأوامر الصوتية ويستجيب فوراً.
          </p>
          <ul className="space-y-2 text-white">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>قل "شوف قدامي" للوصف الفوري</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>قل "أنا فين" لمعرفة موقعك الحالي</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>قل "كشاف" لتشغيل كشاف الكاميرا</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
              <span>قل "ساعدني" للاستماع إلى دليل المساعدة الكامل</span>
            </li>
          </ul>
        </section>

        {/* SOS Section */}
        <section className="bg-slate-900 border-2 border-red-500 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 rounded-full">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-400">نظام الطوارئ SOS</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            زر الطوارئ الأحمر الكبير يرسل موقعك الحالي ورابط تتبع مباشر لجهة الطوارئ عبر واتساب، أو يمكنك الاتصال المباشر.
          </p>
          <ul className="space-y-2 text-white">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              <span>اضغط على زر الطوارئ الأحمر الكبير</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              <span>اختر إرسال الاستغاثة عبر واتساب أو الاتصال المباشر</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              <span>اختصار لوحة المفاتيح: اضغط حرف S أو س لفتح الطوارئ</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
