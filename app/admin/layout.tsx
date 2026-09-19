"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Users, KeyRound, Activity, ShieldCheck, LogOut, Sparkles,
  Menu, X, ExternalLink, ChevronLeft, Database
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      href: "/admin",
      label: "نظرة عامة",
      icon: Activity,
      color: "text-gold-400",
      activeBg: "bg-gold-500/20 border-gold-500/50 text-gold-300",
    },
    {
      href: "/admin/users",
      label: "المستخدمين والجلسات",
      icon: Users,
      color: "text-blue-400",
      activeBg: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    },
    {
      href: "/admin/keys",
      label: "مفاتيح الـ AI وفاحصها",
      icon: KeyRound,
      color: "text-emerald-400",
      activeBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    },
    {
      href: "/admin/backup",
      label: "النسخ الاحتياطي والاسترجاع",
      icon: Database,
      color: "text-amber-400",
      activeBg: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col md:flex-row overflow-x-hidden max-w-full">
      {/* Mobile Topbar */}
      <header className="md:hidden sticky top-0 z-40 bg-dark-800/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-dark-900/80 rounded-xl border border-gold-500/30">
            <Image
              src="/icons/icon-192.png"
              alt="Dahab Software"
              width={28}
              height={28}
              className="w-7 h-7 object-contain rounded-lg"
            />
          </div>
          <div>
            <h1 className="font-black text-base text-gold-400 leading-tight">لوحة نور دهب</h1>
            <span className="text-[10px] text-gray-400">إدارة النظام والحماية</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="القائمة الجانبية"
          className="p-2.5 rounded-xl bg-dark-700 text-gray-200 border border-gray-700 active:scale-95 transition-all"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Navigation (Responsive Drawer on Mobile, Sticky on Desktop) */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen w-72 md:w-64 bg-dark-800 border-l border-gray-800 p-5 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-dark-900/80 rounded-2xl border border-gold-500/30">
                <Image
                  src="/icons/icon-192.png"
                  alt="Dahab Software"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain rounded-xl"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-gold-400 leading-snug">لوحة نور دهب</h2>
                <span className="text-xs text-gray-400">Dahab Software</span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white bg-dark-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all border ${
                    isActive
                      ? item.activeBg
                      : "bg-dark-700/40 border-transparent text-gray-300 hover:bg-dark-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? "" : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="w-4 h-4 opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Logout */}
        <div className="pt-5 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">نظام الجلسة الواحدة نشط</span>
          </div>

          <div className="text-center p-2.5 bg-dark-700/50 rounded-2xl border border-gray-700/60">
            <p className="text-xs text-gray-300 font-bold">م/ إسلام أبو دهب</p>
            <a
              href="https://dahabsoftware.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-gold-400 hover:underline font-bold mt-0.5"
            >
              Dahab Software <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-sm border border-red-500/30 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen md:h-screen md:overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
