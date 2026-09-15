"use client";

import { useState } from "react";
import { AlertTriangle, PhoneCall, Send, X } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  emergencyPhone?: string;
  guardianName?: string;
}

export function EmergencySOSModal({
  isOpen,
  onClose,
  locationName,
  emergencyPhone = "",
  guardianName = ""
}: EmergencySOSModalProps) {
  const { speak } = useSpeech();
  const { triggerHaptic } = useHaptic();
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const displayPhone = emergencyPhone || "لم يُضف بعد";
  const displayGuardian = guardianName || "جهة الطوارئ";

  const handleSendWhatsApp = () => {
    if (!emergencyPhone) {
      speak("لم يتم إضافة رقم الطوارئ لهذا الحساب. تواصل مع المسؤول لإضافته.");
      alert("لم يتم إضافة رقم الطوارئ في إعدادات الحساب. يرجى تواصل المشرف لإضافة رقم ولي الأمر.");
      return;
    }
    triggerHaptic("error");
    setSending(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const mapLink = `https://maps.google.com/?q=${lat},${lon}`;
        const msg = encodeURIComponent(
          `🚨 نداء استغاثة عاجل!\nمن تطبيق نور دهب.\nالموقع: ${locationName || "غير محدد"}\n🗺️ ${mapLink}`
        );
        const cleanPhone = emergencyPhone.replace(/[^0-9]/g, "");
        speak(`جارٍ إرسال موقعك لـ ${displayGuardian} عبر واتساب.`);
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
        setSending(false);
        onClose();
      },
      () => {
        const msg = encodeURIComponent(`🚨 نداء استغاثة عاجل من تطبيق نور دهب! أحتاج مساعدة. الموقع: ${locationName || "غير محدد"}`);
        const cleanPhone = emergencyPhone.replace(/[^0-9]/g, "");
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
        setSending(false);
        onClose();
      }
    );
  };

  const handleDirectCall = () => {
    if (!emergencyPhone) {
      speak("لم يتم إضافة رقم الطوارئ لهذا الحساب.");
      return;
    }
    triggerHaptic("error");
    speak(`جارٍ الاتصال بـ ${displayGuardian}...`);
    window.location.href = `tel:${emergencyPhone}`;
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
        </div>

        <div className="space-y-3">
          <button onClick={handleSendWhatsApp} disabled={sending}
            className="w-full py-4 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            {sending ? "جارٍ الإرسال..." : "إرسال موقعي عبر واتساب"}
          </button>

          <button onClick={handleDirectCall}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2">
            <PhoneCall className="w-5 h-5" />
            اتصال مباشر الآن
          </button>
        </div>

        <button onClick={onClose} className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm mx-auto">
          <X className="w-4 h-4" />
          إلغاء وإغلاق
        </button>
      </div>
    </div>
  );
}