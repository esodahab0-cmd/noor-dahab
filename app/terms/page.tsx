"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, AlertCircle, Home } from "lucide-react";
import { useA11y } from "@/components/GlobalA11yProvider";

export default function TermsPage() {
  const router = useRouter();
  const { announce } = useA11y();

  useEffect(() => {
    announce("صفحة شروط الاستخدام. قواعد وإرشادات استخدام تطبيق نور دهب.");
  }, [announce]);

  const handleBack = () => {
    announce("العودة إلى الصفحة الرئيسية.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-400 p-3.5 sm:p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 sm:mb-8 pb-2 border-b border-gray-800">
        <h1 className="text-xl sm:text-3xl font-black text-amber-400">شروط الاستخدام</h1>
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
        {/* Acceptance Section */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">القبول بالشروط</h2>
          </div>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            باستخدامك لتطبيق نور دهب، أنت توافق على الالتزام بهذه الشروط والأحكام. تم تصميم النظام كمساعد بصري مساند للمكفوفين وضعاف البصر.
          </p>
        </section>

        {/* Intended Use */}
        <section className="bg-slate-900 border border-amber-400/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-amber-400 rounded-full">
              <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">الاستخدام المقصود</h2>
          </div>
          <div className="space-y-2 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              تطبيق نور دهب مخصص لمساعدة الكفيف في:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>الوصف البصري الفوري للبيئة المحيطة والعوائق</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>قراءة النصوص والورق واللافتات والعملات النقدية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>المساعدة في معرفة الشارع ومحطات المترو وإرسال الاستغاثة عند الطوارئ</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Prohibited Uses */}
        <section className="bg-slate-900 border border-red-500/70 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-red-500 rounded-full">
              <AlertCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-red-400">تنبيه السلامة</h2>
          </div>
          <div className="space-y-2 text-white">
            <p className="text-sm sm:text-base leading-relaxed">
              تطبيق نور دهب هو أداة ذكاء اصطناعي مساعدة ولا يغني عن العصا البيضاء أو وسائل الحذر الشخصية المعتادة في الشارع وعبور الطرق السريعة.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
