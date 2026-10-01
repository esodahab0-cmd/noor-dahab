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
    <div className="min-h-screen bg-slate-950 text-amber-400 p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-amber-400">سياسة الخصوصية</h1>
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
        {/* Overview Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Shield className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">التزامنا بالخصوصية</h2>
          </div>
          <p className="text-white text-lg leading-relaxed">
            نحن في شركة دهب سوفتوير نلتزم بحماية خصوصيتك. جميع البيانات التي يتم جمعها تستخدم فقط لتحسين تجربتك في استخدام التطبيق، ولا يتم مشاركتها مع أي طرف ثالث.
          </p>
        </section>

        {/* Camera Permission */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Camera className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">إذن الكاميرا</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              نستخدم الكاميرا فقط لتحليل الصور وتوفير وصف صوتي فوري لما أمامك.
            </p>
            <div className="bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-amber-400 font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                ضمان مهم:
              </p>
              <p className="text-lg">
                لا يتم تخزين أي صور أو فيديو من الكاميرا. جميع الصور تُحلل فوراً ثم تُحذف تماماً من الذاكرة.
              </p>
            </div>
          </div>
        </section>

        {/* Microphone Permission */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Mic className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">إذن الميكروفون</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              نستخدم الميكروفون فقط لاستقبال أوامرك الصوتية باللغة العربية.
            </p>
            <div className="bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-amber-400 font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                ضمان مهم:
              </p>
              <p className="text-lg">
                لا يتم تسجيل أو تخزين أي صوت من الميكروفون. جميع الأوامر تُعالج فوراً ثم تُحذف تماماً من الذاكرة.
              </p>
            </div>
          </div>
        </section>

        {/* Location Permission */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <MapPin className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">إذن الموقع الجغرافي</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              نستخدم الموقع الجغرافي فقط لتحديد موقعك الحالي ووصف الشارع الذي أنت فيه، ولإرسال موقعك في حالة الطوارئ.
            </p>
            <div className="bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-amber-400 font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                ضمان مهم:
              </p>
              <p className="text-lg">
                لا يتم مشاركة موقعك مع أي طرف ثالث. الموقع يُستخدم فقط لتحسين تجربتك وإرسال الاستغاثات لجهات الطوارئ المحددة في حسابك.
              </p>
            </div>
          </div>
        </section>

        {/* Data Storage */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Lock className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">تخزين البيانات</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              البيانات التي نخزنها تشمل:
            </p>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>بيانات حسابك (اسم المستخدم وكلمة المرور مشفرة)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>أرقام الطوارئ التي تضيفها في حسابك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>الإعدادات والتفضيلات الشخصية</span>
              </li>
            </ul>
            <p className="text-lg leading-relaxed mt-4">
              جميع البيانات محمية بالتشفير ولا يتم مشاركتها مع أي طرف ثالث. يمكنك حذف حسابك وجميع بياناتك في أي وقت.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
