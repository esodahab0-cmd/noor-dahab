"use client";

import { useEffect, useState } from "react";
import { Users, Radio, ShieldCheck, Key, ArrowUpRight, Cpu } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

interface UserDoc {
  id: string;
  username?: string;
  name?: string;
  isOnline?: boolean;
  activeSessionToken?: string;
  lastLoginAt?: string;
  emergencyPhone?: string;
  guardianName?: string;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyStats, setKeyStats] = useState({ geminiCount: 4, cloudflareCount: 2 });

  useEffect(() => {
    // Fetch key pool stats securely from server (zero client-side keys)
    fetch("/api/admin/keys/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setKeyStats({
            geminiCount: d.geminiCount ?? 4,
            cloudflareCount: d.cloudflareCount ?? 2,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserDoc[];
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const onlineUsers = users.filter((u) => u.isOnline || u.activeSessionToken);
  const activeSessions = users.filter((u) => u.activeSessionToken);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl w-full min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">نظام إدارة نور دهب</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          مراقبة حالة النظام والمستخدمين المتصلين في الوقت الفعلي ومفاتيح الذكاء الاصطناعي.
        </p>
      </div>

      {/* Realtime KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Live Online Users */}
        <div className="p-4 sm:p-6 bg-dark-800 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">متصل الآن</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-4xl font-black text-white">{loading ? "..." : onlineUsers.length}</span>
            <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 opacity-60" />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">مستخدم متصل حالياً</p>
        </div>

        {/* Total Users */}
        <div className="p-4 sm:p-6 bg-dark-800 border border-gray-800 rounded-2xl sm:rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">إجمالي الحسابات</span>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-4xl font-black text-white">{loading ? "..." : users.length}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">حسابات كفوف مسجلة</p>
        </div>

        {/* Gemini Keys Pool */}
        <div className="p-4 sm:p-6 bg-dark-800 border border-gray-800 rounded-2xl sm:rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-gold-400 uppercase tracking-wider">حوض Gemini</span>
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-4xl font-black text-white">{keyStats.geminiCount}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">مفتاح تدوير تلقائي</p>
        </div>

        {/* Cloudflare Keys Pool */}
        <div className="p-4 sm:p-6 bg-dark-800 border border-gray-800 rounded-2xl sm:rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-orange-400 uppercase tracking-wider">حوض Cloudflare</span>
            <Key className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-4xl font-black text-white">{keyStats.cloudflareCount}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">مفتاح احتياطي 200 OK</p>
        </div>
      </div>

      {/* Online Users List Widget */}
      <div className="bg-dark-800 border border-gray-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white">المستخدمون المتصلون في الوقت الفعلي</h3>
          </div>
          <Link href="/admin/users" className="text-xs text-gold-400 hover:underline flex items-center gap-1 font-bold">
            إدارة جميع الحسابات <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-800">
          {onlineUsers.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <p className="font-bold text-white">{u.name || u.id}</p>
                  <p className="text-xs text-gray-400 font-mono">@{u.username || u.id}</p>
                </div>
              </div>

              <div className="text-left text-xs">
                {u.guardianName && (
                  <p className="text-amber-300 font-bold">ولي الأمر: {u.guardianName}</p>
                )}
                {u.emergencyPhone && (
                  <p className="text-gray-400 font-mono">طوارئ: {u.emergencyPhone}</p>
                )}
              </div>
            </div>
          ))}

          {onlineUsers.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">
              لا يوجد مستخدمون متصلون حالياً بالخدمة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}