"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldAlert, Sparkles, Volume2, Mic } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";

export default function LoginPage() {
  const router = useRouter();
  const { speak, startListening, isListening, unlockSpeaker } = useSpeech();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listeningTarget, setListeningTarget] = useState<"user" | "pass" | null>(null);

  const handleVoiceHelp = () => {
    unlockSpeaker();
    speak("أهلاً بك في تطبيق نور دهب. يمكنك نطق اسم المستخدم وكلمة المرور بالصوت عبر الضغط على أيقونة الميكروفون.");
  };

  const handleVoiceInput = (target: "user" | "pass") => {
    unlockSpeaker();
    setListeningTarget(target);
    const prompt = target === "user" ? "تفضل بنطق اسم المستخدم الآن..." : "تفضل بنطق كلمة المرور الآن...";
    speak(prompt);

    setTimeout(() => {
      startListening((text) => {
        setListeningTarget(null);
        if (!text) return;
        const cleaned = text.replace(/\s+/g, "").trim();
        if (target === "user") {
          setUsername(cleaned);
          speak(`تم إدخال اسم المستخدم: ${text}`);
        } else {
          setPassword(cleaned);
          speak("تم إدخال كلمة المرور بنجاح.");
        }
      });
    }, 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      speak("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تسجيل الدخول");
      }

      localStorage.setItem("noor_user", JSON.stringify(data.user));
      localStorage.setItem("noor_session_token", data.sessionToken);

      speak(`مرحباً بك ${data.user.name}. تم تسجيل الدخول بنجاح.`);

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
      speak(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark-900">
      <div className="w-full max-w-md bg-dark-800 border-2 border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-gold-500/10 rounded-2xl border border-gold-500/30 text-gold-400 mb-2">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-gold-400 tracking-tight">نور دهب</h1>
          <p className="text-gray-400 text-sm">تسجيل الدخول الصوتي</p>
        </div>

        <button
          type="button"
          onClick={handleVoiceHelp}
          className="w-full py-2.5 px-3 rounded-xl bg-gold-500/10 text-gold-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-gold-500/30 hover:bg-gold-500/20 transition-all"
        >
          <Volume2 className="w-4 h-4" />
          مساعدة صوتية
        </button>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">اسم المستخدم</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اكتب أو انطق اسمك"
                className="w-full px-4 py-3 pl-12 bg-dark-700 border border-gray-600 rounded-xl text-white text-base focus:outline-none focus:border-gold-500"
                autoComplete="username"
                required
              />
              <button
                type="button"
                onClick={() => handleVoiceInput("user")}
                className={`absolute left-2 p-2 rounded-lg transition-all ${
                  isListening && listeningTarget === "user"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gold-500/20 text-gold-400 hover:bg-gold-500/30"
                }`}
                title="إملاء بالصوت"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">كلمة المرور</label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pl-12 bg-dark-700 border border-gray-600 rounded-xl text-white text-base focus:outline-none focus:border-gold-500"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => handleVoiceInput("pass")}
                className={`absolute left-2 p-2 rounded-lg transition-all ${
                  isListening && listeningTarget === "pass"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gold-500/20 text-gold-400 hover:bg-gold-500/30"
                }`}
                title="إملاء بالصوت"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold-500 hover:bg-gold-600 active:scale-98 text-dark-900 font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-6 h-6" />
            {loading ? "جارٍ التحقق والدخول..." : "تسجيل الدخول"}
          </button>

          {/* Guest Trial Mode Entry */}
          <button
            type="button"
            onClick={() => {
              unlockSpeaker();
              const guestUser = {
                username: "guest",
                name: "زائر كريم",
                role: "guest",
                isGuest: true,
              };
              localStorage.setItem("noor_user", JSON.stringify(guestUser));
              localStorage.setItem("noor_session_token", "guest-trial-token");
              speak("أهلاً بك كزائر في نور دهب. جميع الميزات المحلية والمواصلات متاحة مجاناً، ومعك خمس محاولات للذكاء الاصطناعي اليوم.");
              router.push("/");
            }}
            className="w-full py-3 bg-dark-700 hover:bg-dark-600 active:scale-98 text-gold-300 border border-gold-500/30 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>الدخول كزائر (تجربة مجانية)</span>
          </button>
        </form>

        {/* Creator & Company Credits */}
        <div className="pt-4 border-t border-gray-800 text-center space-y-1">
          <p className="text-xs text-gray-300 font-bold">
            فكرة وتطوير: <span className="text-gold-400">المهندس إسلام أبو دهب</span>
          </p>
          <a
            href="https://dahabsoftware.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-amber-300/80 hover:text-gold-300 font-medium underline underline-offset-4 transition-colors"
          >
            شركة دهب سوفتوير (Dahab Software) 🌐
          </a>
        </div>
      </div>
    </div>
  );
}