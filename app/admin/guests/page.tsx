"use client";

import { useState, useEffect } from "react";
import { Users, Radio, RefreshCw, Smartphone, Clock, Globe } from "lucide-react";

interface GuestInfo {
  guestId: string;
  userAgent?: string;
  ipHash?: string;
  connectedAt: number;
  lastPingAt: number;
  idleSeconds: number;
  durationMinutes: number;
}

export default function AdminGuestsPage() {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchGuests = async () => {
    try {
      const res = await fetch("/api/admin/guests/ping");
      const data = await res.json();
      if (data.success) {
        setOnlineCount(data.onlineCount || 0);
        setGuests(data.guests || []);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.warn("Failed to fetch active guests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
    // Auto refresh every 6 seconds for live monitoring
    const interval = setInterval(fetchGuests, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl w-full min-w-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
            مراقبة الزوار المتصلين الآن
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            متابعة لحظية ومباشرة لعدد الأشخاص الذين يتصفحون تطبيق نور دهب كضيوف في هذا الوقت.
          </p>
        </div>

        <button
          onClick={fetchGuests}
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gold-400 border border-gold-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث الآن ({lastRefreshed.toLocaleTimeString("ar-EG")})
        </button>
      </div>

      {/* Big Counter Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-gradient-to-br from-emerald-950/60 to-dark-800 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-black mb-2 border border-emerald-500/30">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              مباشر لايف (Live Active)
            </span>
            <h2 className="text-base font-bold text-gray-300">الزوار النشطون في هذه اللحظة</h2>
            <p className="text-xs text-gray-400 mt-1">الأجهزة التي أرسلت نشاطاً خلال آخر 60 ثانية</p>
          </div>
          <div className="text-5xl sm:text-6xl font-black text-emerald-400 font-mono tracking-wider">
            {onlineCount}
          </div>
        </div>

        <div className="bg-dark-800 border border-gray-800 rounded-3xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            وتيرة التحديث
          </div>
          <p className="text-xl font-black text-white">كل 6 ثوانٍ تلقائياً</p>
          <p className="text-[11px] text-gray-500 mt-1">يتم تنظيف الجلسات الخاملة آلياً</p>
        </div>
      </div>

      {/* Table of active guests */}
      <div className="bg-dark-800 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            تفاصيل جلسات الزوار النشطة ({guests.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-dark-900 text-gray-400 text-xs border-b border-gray-800">
              <tr>
                <th className="p-4">رقم الجلسة (Guest ID)</th>
                <th className="p-4">نوع الجهاز / المتصفح</th>
                <th className="p-4">عنوان IP التقريبي</th>
                <th className="p-4">مدة التواجد</th>
                <th className="p-4">آخر نشاط</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {guests.map((g) => (
                <tr key={g.guestId} className="hover:bg-dark-700/20">
                  <td className="p-4 font-mono text-xs text-gold-300 font-bold">
                    {g.guestId}
                  </td>
                  <td className="p-4 text-xs text-gray-300 max-w-xs truncate" title={g.userAgent}>
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                      {g.userAgent?.includes("Mobile")
                        ? "هاتف محمول (Mobile)"
                        : "كمبيوتر مكتبي (Desktop)"}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                      {g.ipHash || "مخفي"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-300">
                    {g.durationMinutes === 0 ? "أقل من دقيقة" : `منذ ${g.durationMinutes} دقيقة`}
                  </td>
                  <td className="p-4 text-xs text-gray-400 font-mono">
                    منذ {g.idleSeconds} ثانية
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      متصل الآن
                    </span>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    لا يوجد زوار متصلون حالياً في هذه اللحظة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
