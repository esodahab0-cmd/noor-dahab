"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Camera, Mic, MapPin, Lock, Home } from "lucide-react";
import { useA11y } from "@/components/GlobalA11yProvider";

export default function PrivacyPage() {
  const router = useRouter();
  const { announce } = useA11y();

  useEffect(() => {
    announce("صفحة سياسة الخصوصية. معلومات عن كيفية استخدام الكاميرا والميكروفون والموقع الجغرافي.");
  }, [announce]);

  const handleBack = () => {
    announce("العودة إلى الصفحة الرئيسية.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-400 p-3.5 sm:p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 sm:mb-8 pb-2 border-b border-gray-800">
        <h1 className="text-xl sm:text-3xl font-black text-amber-400">سياسة الخصوصية</h1>
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
        {/* Overview Section */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">التزامنا بالخصوصية</h2>
          </div>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            نحن في شركة دهب سوفتوير نلتزم بحماية خصوصيتك الصارمة. كافة البيانات تُعالج بشكل فوري داخل جهازك، ولا يتم مشاركتها أو بيعها لأي طرف ثالث نهائياً.
          </p>
        </section>

        {/* Camera Permission */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Camera className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">إذن الكاميرا</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              نستخدم الكاميرا فقط لتحليل المشهد وتوفير وصف صوتي فوري باللغة العربية لما أمامك.
            </p>
            <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1.5">
              <p className="text-amber-400 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                ضمان الأمان:
              </p>
              <p className="text-xs sm:text-sm text-gray-200">
                لا يتم تخزين أي صور أو فيديو من الكاميرا على خوادم خارجية. الصور تُحلل فورياً ولا يتم حفظها.
              </p>
            </div>
          </div>
        </section>

        {/* Microphone Permission */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Mic className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">إذن الميكروفون</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              نستخدم الميكروفون فقط لاستقبال أوامرك الصوتية واستفساراتك بالعامية المصرية.
            </p>
            <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1.5">
              <p className="text-amber-400 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                ضمان الأمان:
              </p>
              <p className="text-xs sm:text-sm text-gray-200">
                لا يتم تسجيل أو تخزين أي صوت على أي خادم. الأوامر تُترجم فورياً إلى نصوص وتُحذف فور انتهاء الجلسة.
              </p>
            </div>
          </div>
        </section>

        {/* Location Permission */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">إذن الموقع الجغرافي (GPS)</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              نستخدم الـ GPS لتحديد اسم الشارع الذي تقف فيه، وأقرب محطة مترو، وإرسال موقعك بدقة في حالة الطوارئ.
            </p>
          </div>
        </section>

        {/* Data Storage */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <Lock className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">تخزين البيانات والوجوه</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              جميع بياناتك الشخصية (صور الوجوه المسجلة، أرقام الطوارئ، التفضيلات) تُحفظ محلياً 100% داخل ذاكرة جهازك فقط ولا تخرج منه أبداً.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
