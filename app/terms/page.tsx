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
    <div className="min-h-screen bg-slate-950 text-amber-400 p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-amber-400">شروط الاستخدام</h1>
        <button
          onClick={handleBack}
          aria-label="العودة إلى الصفحة الرئيسية - العودة لاستخدام التطبيق"
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full focus:ring-4 focus:ring-amber-400"
        >
          <Home className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 space-y-8">
        {/* Acceptance Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <FileText className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">القبول بالشروط</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            باستخدامك لتطبيق نور دهب، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام التطبيق.
          </p>
        </section>

        {/* Intended Use */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <CheckCircle className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">الاستخدام المقصود</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              تطبيق نور دهب مصمم خصيصاً لخدمة الأشخاص المكفوفين وضعاف البصر.
            </p>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>الاستخدام الشخصي للمساعدة في الرؤية والتنقل</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>فحص البيئة المحيطة والتعرف على الأشياء</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>قراءة النصوص والوثائق</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>التنقل والمساعدة في تحديد الموقع</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>استدعاء المساعدة في حالات الطوارئ</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Prohibited Uses */}
        <section className="bg-slate-900 border-2 border-red-500 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 rounded-full">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-400">الاستخدامات المحظورة</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              يُمنع استخدام التطبيق للأغراض التالية:
            </p>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>أي نشاط غير قانوني أو مخالف للقوانين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>التجسس أو المراقبة غير المصرح بها</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>انتهاك خصوصية الآخرين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>التلاعب في نظام الاستغاثة الكاذب</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>محاولة اختراق أو تدمير التطبيق أو خوادمه</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Account Responsibility */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <CheckCircle className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">مسؤولية الحساب</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              أنت مسؤول تماماً عن جميع الأنشطة التي تتم من خلال حسابك.
            </p>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>الحفاظ على سرية كلمة المرور</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>عدم مشاركة بيانات الدخول مع أي شخص</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Emergency Use */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <AlertCircle className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">استخدام نظام الطوارئ</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              نظام الطوارئ مخصص لحالات الاستغاثة الحقيقية فقط.
            </p>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>استخدم زر الطوارئ فقط في حالات الخطر الحقيقي</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>التلاعب في نظام الطوارئ قد يؤدي إلى إيقاف حسابك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>تأكد من صحة أرقام الطوارئ المسجلة في حسابك</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Service Availability */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <CheckCircle className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">توفر الخدمة</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              نحن نبذل قصارى جهدنا لضمان توفر الخدمة على مدار الساعة، لكن قد تحدث انقطاعات مؤقتة للصيانة أو لأسباب تقنية خارجة عن إرادتنا.
            </p>
            <p className="text-lg leading-relaxed">
              التطبيق مجاني 100% ونلتزم بتوفيره مجاناً للأبد لجميع المستخدمين.
            </p>
            <p className="text-lg leading-relaxed">
              جميع الميزات الأساسية متاحة مجاناً دون أي رسوم أو اشتراكات.
            </p>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <FileText className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">تغييرات الشروط</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات مهمة عبر التطبيق أو موقعنا الإلكتروني.
          </p>
        </section>
      </main>
    </div>
  );
}
