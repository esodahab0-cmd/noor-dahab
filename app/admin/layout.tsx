"use client";

import { useEffect, useState } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import { Users, KeyRound, Activity, ShieldCheck, LogOut, Sparkles } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("noor_user");
    if (!user) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(user);
    if (parsed.role !== "admin") {
      router.push("/");
      return;
    }
    setAdminUser(parsed);
  }, [router]);

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark-800 border-l border-gray-800 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold-500/20 text-gold-400 rounded-xl border border-gold-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-xl text-gold-400">لوحة نور دهب</h2>
              <span className="text-xs text-gray-400">إدارة النظام والحماية</span>
            </div>
          </div>

          <nav className="space-y-2">
            <a
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 hover:bg-gold-500/20 text-gray-200 hover:text-gold-300 font-bold transition-all border border-transparent hover:border-gold-500/30"
            >
              <Activity className="w-5 h-5 text-gold-400" />
              نظرة عامة
            </a>

            <a
              href="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 hover:bg-gold-500/20 text-gray-200 hover:text-gold-300 font-bold transition-all border border-transparent hover:border-gold-500/30"
            >
              <Users className="w-5 h-5 text-blue-400" />
              المستخدمين والجلسات
            </a>

            <a
              href="/admin/keys"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 hover:bg-gold-500/20 text-gray-200 hover:text-gold-300 font-bold transition-all border border-transparent hover:border-gold-500/30"
            >
              <KeyRound className="w-5 h-5 text-emerald-400" />
              مفاتيح الـ AI وفاحصها
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>نظام الجلسة الواحدة نشط</span>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-sm border border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
