"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import {
  MapPin, ShieldAlert, Battery, Navigation, ExternalLink,
  PhoneCall, RefreshCw, Clock, AlertTriangle, CheckCircle2
} from "lucide-react";

interface LiveTrackData {
  token: string;
  lat: number;
  lon: number;
  locationName?: string;
  speed?: number;
  battery?: number;
  heading?: string;
  updatedAt: number;
  ageSeconds: number;
  isLive: boolean;
}

export default function GuardianLiveTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [data, setData] = useState<LiveTrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/geo/live-track?token=${token}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "جلسة التتبع منتهية أو غير صحيحة");
      }
      setData(json.session);
      setError(null);
      setLastFetchTime(new Date());
    } catch (err: any) {
      setError(err.message || "تعذر تحميل بيانات التتبع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 6000);
    return () => clearInterval(interval);
  }, [token]);

  const googleMapsUrl = data
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lon}`
    : "#";

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center p-3 sm:p-6" dir="rtl">
      {/* Top Header */}
      <header className="w-full max-w-2xl bg-dark-800 border-2 border-gold-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-dark-900 rounded-2xl border border-gold-500/40 shadow">
            <Image
              src="/icons/icon-192.png"
              alt="Dahab Software"
              width={36}
              height={36}
              className="w-9 h-9 object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="font-black text-lg text-gold-400">تتبع الطوارئ المباشر</h1>
            <p className="text-xs text-gray-400">نظام نور دهب لحماية ورعاية المكفوفين</p>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow ${
                data.isLive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${data.isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
              {data.isLive ? "إرسال حي الآن" : `منذ ${data.ageSeconds} ثانية`}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col gap-4">
        {loading && (
          <div className="bg-dark-800 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw className="w-10 h-10 text-gold-400 animate-spin" />
            <p className="text-base font-bold text-gray-200">جارٍ جلب إحداثيات موقع الكفيف الآن...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-950/80 border-2 border-red-500/50 rounded-3xl p-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
            <h2 className="text-lg font-black text-red-300">تنبيه انتهاء الجلسة</h2>
            <p className="text-sm text-gray-300">{error}</p>
            <button
              onClick={fetchTracking}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Live Location Card */}
            <div className="bg-dark-800 border-2 border-gold-500/30 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/40 shrink-0 mt-0.5">
                    <MapPin className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400">آخر موقع تم رصده</h2>
                    <p className="text-base sm:text-lg font-black text-white mt-0.5 leading-snug">
                      {data.locationName || "موقع محدد عبر الـ GPS"}
                    </p>
                  </div>
                </div>

                {typeof data.battery === "number" && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-dark-700 border border-gray-600 rounded-xl text-xs font-bold text-gray-300 shrink-0">
                    <Battery className={`w-4 h-4 ${data.battery < 20 ? "text-red-400" : "text-emerald-400"}`} />
                    <span>{data.battery}%</span>
                  </div>
                )}
              </div>

              {/* Coordinates and Heading Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-dark-900/80 p-2.5 rounded-xl border border-gray-700 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-gray-400 block text-[10px]">الاتجاه الحركي</span>
                    <span className="font-bold text-white">{data.heading || "غير محدد"}</span>
                  </div>
                </div>

                <div className="bg-dark-900/80 p-2.5 rounded-xl border border-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-gray-400 block text-[10px]">توقيت آخر تحديث</span>
                    <span className="font-bold text-white font-mono">
                      {new Date(data.updatedAt).toLocaleTimeString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embedded Live Map */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border-2 border-gold-500/40 shadow-inner bg-dark-950">
                <iframe
                  title="خريطة الموقع المباشر"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "contrast(1.05)" }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.lon - 0.003}%2C${data.lat - 0.002}%2C${data.lon + 0.003}%2C${data.lat + 0.002}&layer=mapnik&marker=${data.lat}%2C${data.lon}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 px-4 bg-gold-500 hover:bg-gold-400 active:scale-98 text-dark-900 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Navigation className="w-5 h-5" />
                  الذهاب للموقع عبر Google Maps
                </a>

                <button
                  onClick={fetchTracking}
                  className="py-3.5 px-4 bg-dark-700 hover:bg-dark-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-gray-600 shadow"
                >
                  <RefreshCw className="w-4 h-4 text-gold-400" />
                  تحديث فوري للموقع
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl text-center py-4 text-xs text-gray-500">
        تطبيق نور دهب لحماية ورعاية المكفوفين • ابتكار وتطوير Dahab Software
      </footer>
    </div>
  );
}
