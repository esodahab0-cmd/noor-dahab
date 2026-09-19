"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, PhoneCall, Send, X, Navigation, ShieldCheck } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  emergencyPhone?: string;
  guardianName?: string;
  secondaryPhone?: string;
}

export function EmergencySOSModal({
  isOpen,
  onClose,
  locationName,
  emergencyPhone = "",
  guardianName = "",
  secondaryPhone = "",
}: EmergencySOSModalProps) {
  const { speak } = useSpeech();
  const { triggerHaptic } = useHaptic();
  const [sending, setSending] = useState(false);
  const [liveToken, setLiveToken] = useState<string>("");
  const syncTimerRef = useRef<any>(null);

  // Generate a live tracking session token when modal opens
  useEffect(() => {
    if (isOpen) {
      const token = `sos_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      setLiveToken(token);

      // Start periodic live location syncing to the tracking API
      const syncLiveLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lon, speed } = pos.coords;
            try {
              let batteryPercent: number | undefined;
              if ("getBattery" in navigator) {
                const b: any = await (navigator as any).getBattery();
                batteryPercent = Math.round(b.level * 100);
              }

              await fetch("/api/geo/live-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token,
                  lat,
                  lon,
                  locationName,
                  speed: speed ?? undefined,
                  battery: batteryPercent,
                }),
              });
            } catch (err) {
              console.warn("Live track push error:", err);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      };

      syncLiveLocation();
      syncTimerRef.current = setInterval(syncLiveLocation, 10000);
    } else {
      clearInterval(syncTimerRef.current);
    }

    return () => clearInterval(syncTimerRef.current);
  }, [isOpen, locationName]);

  if (!isOpen) return null;

  const displayPhone = emergencyPhone || "لم يُضف بعد";
  const displayGuardian = guardianName || "جهة الطوارئ الأساسية";

  const handleSendWhatsApp = (targetPhone = emergencyPhone, contactTitle = displayGuardian) => {
    if (!targetPhone) {
      speak("لم يتم إضافة رقم الطوارئ لهذا الحساب. تواصل مع المسؤول لإضافته.");
      alert("لم يتم إضافة رقم الطوارئ في إعدادات الحساب. يرجى مراجعة المشرف لإضافة رقم ولي الأمر.");
      return;
    }

    triggerHaptic("error");
    setSending(true);

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const mapLink = `https://maps.google.com/?q=${lat},${lon}`;
        const liveTrackingUrl = liveToken ? `https://dahabsoftware.online/track/${liveToken}` : "";

        const msgText = [
          `🚨 نداء استغاثة عاجل من تطبيق نور دهب!`,
          `الموقع الحالي: ${locationName || "غير محدد بدقة"}`,
          `📍 نقطة على خريطة جوجل: ${mapLink}`,
          liveTrackingUrl ? `🗺️ رابط تتبع تحركاتي المباشر لايف: ${liveTrackingUrl}` : "",
          `نرجو التواصل والاطمئنان فوراً.`
        ].filter(Boolean).join("\n\n");

        let cleanPhone = targetPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
          cleanPhone = "2" + cleanPhone;
        }

        speak(`جارٍ إرسال موقعك ورابط التتبع المباشر لـ ${contactTitle} عبر واتساب.`);
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`, "_blank");
        setSending(false);
        onClose();
      },
      () => {
        const liveTrackingUrl = liveToken ? `https://dahabsoftware.online/track/${liveToken}` : "";
        const msgText = `🚨 نداء استغاثة عاجل من تطبيق نور دهب! أحتاج مساعدة.\nالموقع: ${locationName || "غير محدد"}\n${liveTrackingUrl ? `رابط التتبع: ${liveTrackingUrl}` : ""}`;
        let cleanPhone = targetPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
          cleanPhone = "2" + cleanPhone;
        }
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`, "_blank");
        setSending(false);
        onClose();
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleDirectCall = (phone = emergencyPhone, title = displayGuardian) => {
    if (!phone) {
      speak("لم يتم إضافة رقم الطوارئ لهذا الحساب.");
      return;
    }
    triggerHaptic("error");
    speak(`جارٍ الاتصال بـ ${title}...`);
    window.location.href = `tel:${phone}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-red-950/90 border-4 border-red-500 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-pulse">
          <AlertTriangle className="w-12 h-12" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">طوارئ واستغاثة فورية</h2>
          <div className="mt-2 p-2 bg-black/40 rounded-xl text-sm">
            <p className="text-amber-300 font-bold">ولي الأمر: {displayGuardian}</p>
            <p className="text-gray-400 font-mono text-xs">{displayPhone}</p>
          </div>
          {liveToken && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Navigation className="w-3 h-3 animate-spin" />
              تم تجهيز رابط التتبع الحي المباشر
            </span>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSendWhatsApp(emergencyPhone, displayGuardian)}
            disabled={sending}
            className="w-full py-4 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {sending ? "جارٍ الإرسال..." : "إرسال الاستغاثة والتتبع الحي عبر واتساب"}
          </button>

          <button
            onClick={() => handleDirectCall(emergencyPhone, displayGuardian)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            اتصال مباشر الآن
          </button>

          {secondaryPhone && (
            <button
              onClick={() => handleDirectCall(secondaryPhone, "رقم الطوارئ الاحتياطي")}
              className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-gray-700"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" />
              اتصال بجهة الطوارئ الاحتياطية ({secondaryPhone})
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm mx-auto"
        >
          <X className="w-4 h-4" />
          إلغاء وإغلاق
        </button>
      </div>
    </div>
  );
}