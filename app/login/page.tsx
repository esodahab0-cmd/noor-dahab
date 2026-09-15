"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldAlert, Sparkles, Volume2 } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";

export default function LoginPage() {
  const router = useRouter();
  const { speak } = useSpeech();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVoiceHelp = () => {
    speak("أهلاً بك في تطبيق نور دهب. يرجى كتابة اسم المستخدم وكلمة المرور الخاصة بك للدخول.");
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

      // If role is admin -> go to /admin, otherwise always go to blind app /
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
      <div className="w-full max-w-md bg-dark-800 border-2 border-gold-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-gold-500/10 rounded-2xl border border-gold-500/30 text-gold-400 mb-2">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-gold-400 tracking-tight">نور دهب</h1>
          <p className="text-gray-400 text-sm">تسجيل الدخول</p>
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
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold-500 hover:bg-gold-600 active:scale-98 text-dark-900 font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-6 h-6" />
            {loading ? "جارٍ التحقق والدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}