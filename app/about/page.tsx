"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Code, Award, Home } from "lucide-react";
import { useA11y } from "@/components/GlobalA11yProvider";

export default function AboutPage() {
  const router = useRouter();
  const { announce } = useA11y();

  useEffect(() => {
    announce("صفحة عن المشروع. معلومات عن المهندس إسلام أبو دهب وشركة دهب سوفتوير.");
  }, [announce]);

  const handleBack = () => {
    announce("العودة إلى الصفحة الرئيسية.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-400 p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-amber-400">عن المشروع</h1>
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
        {/* Developer Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Code className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">المطور</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-xl font-bold text-amber-400">المهندس إسلام أبو دهب</p>
            <p className="text-lg leading-relaxed">
              مهندس برمجيات مصري متخصص في تطوير التطبيقات والأنظمة الذكية للمكفوفين وضعاف البصر.
            </p>
            <p className="text-lg leading-relaxed">
              المؤسس والمدير التنفيذي لشركة دهب سوفتوير، مع خبرة واسعة في تطوير تطبيقات الويب والهواتف الذكية.
            </p>
            <p className="text-lg leading-relaxed">
              شغفه هو تمكين ذوي الاحتياجات الخاصة من استخدام التكنولوجيا بسهولة وكفاءة، وتحسين جودة حياتهم اليومية.
            </p>
            <p className="text-lg leading-relaxed">
              يمتلك خبرة في تطوير حلول الذكاء الاصطناعي، واجهات المستخدم القابلة للوصول، وتطبيقات الويب التقدمية (PWA).
            </p>
          </div>
        </section>

        {/* Company Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Award className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">شركة دهب سوفتوير</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              Dahab Software هي شركة برمجيات مصرية تهدف إلى تطوير حلول تقنية مبتكرة لخدمة ذوي الاحتياجات الخاصة في مصر والوطن العربي.
            </p>
            <p className="text-lg leading-relaxed">
              رؤيتنا: تمكين الأشخاص المكفوفين وضعاف البصر من استخدام التكنولوجيا بسهولة وكفاءة، وتحسين جودة حياتهم اليومية.
            </p>
            <div className="pt-4 space-y-2">
              <p className="text-amber-400 font-bold">الموقع الإلكتروني:</p>
              <a
                href="https://dahabsoftware.online"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-amber-400 underline focus:ring-4 focus:ring-amber-400"
              >
                https://dahabsoftware.online
              </a>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 rounded-full">
              <Heart className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">مهمتنا</h2>
          </div>
          <div className="space-y-3 text-white">
            <p className="text-lg leading-relaxed">
              توفير تقنيات متقدمة ومجانية 100% للأشخاص المكفوفين وضعاف البصر، لمساعدتهم على الاستقلالية وتحقيق أهدافهم الشخصية والمهنية.
            </p>
            <p className="text-lg leading-relaxed">
              نؤمن بأن التكنولوجيا يجب أن تكون متاحة للجميع، ونلتزم بتطوير حلول سهلة الاستخدام وفعالة وقابلة للوصول.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
