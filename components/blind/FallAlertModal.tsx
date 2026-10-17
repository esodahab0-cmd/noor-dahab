"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AlertOctagon, Heart, PhoneCall, ShieldAlert, Check } from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { playSpatialHazardBeep } from "@/lib/utils/spatial-audio";

interface FallAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyPhone?: string;
  guardianName?: string;
  locationName?: string;
}

export function FallAlertModal({
  isOpen,
  onClose,
  emergencyPhone = "",
  guardianName = "",
  locationName = "",
}: FallAlertModalProps) {
  const [countdown, setCountdown] = useState(15);
  const [triggeredEmergency, setTriggeredEmergency] = useState(false);

  const { speak, stopSpeaking } = useSpeech();
  const { triggerHaptic } = useHaptic();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. تشغيل التنبيه الصوتي والحركي عند فتح النافذة
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(15);
      setTriggeredEmergency(false);
      return;
    }

    setCountdown(15);
    setTriggeredEmergency(false);

    // نداء أولي للكفيف
    speak("تم رصد سقوط مفاجئ! هل أنت بخير؟ اضغط على الشاشة لإلغاء نداء الطوارئ.");
    triggerHaptic("danger");
    playSpatialHazardBeep(0, "danger");

    // عداد تنازلي 15 ثانية
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleEmergencyDispatch();
          return 0;
        }

        // تنبيه صوتي واهتزازي مع كل ثانية
        if (prev % 3 === 0) {
          playSpatialHazardBeep(0, "danger");
          triggerHaptic("danger");
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // 2. إطلاق الاستغاثة التلقائية عند انتهاء العداد دون استجابة
  const handleEmergencyDispatch = useCallback(() => {
    setTriggeredEmergency(true);
    speak("جارٍ إرسال نداء استغاثة آلي لولي الأمر والاتصال به فوراً.");
    triggerHaptic("danger");

    const phone = emergencyPhone || "";
    const guardian = guardianName || "ولي الأمر";

    // إرسال رسالة واتساب عاجلة تلقائياً مع موقع GPS
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const mapLink = `https://maps.google.com/?q=${lat},${lon}`;

          const alertMsg = [
            `🚨 نداء استغاثة وسقوط طارئ من هاتف الكفيف!`,
            `تم رصد سقوط مفاجئ وارتطام وتوقف عن الحركة دون استجابة من الكفيف.`,
            `الموقع: ${locationName || "غير محدد بدقة"}`,
            `📍 خريطة الموقع الدقيق: ${mapLink}`,
            `يرجى التواصل والاطمئنان عليه فوراً بالاتصال على هاتفه!`
          ].join("\n\n");

          let cleanPhone = phone.replace(/[^0-9]/g, "");
          if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
            cleanPhone = "2" + cleanPhone;
          }

          if (cleanPhone) {
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMsg)}`, "_blank");
          }

          // بعد ثانية نقوم بفتح الاتصال الهاتفي المباشر
          setTimeout(() => {
            if (phone) {
              window.location.href = `tel:${phone}`;
            }
          }, 1500);
        },
        () => {
          // في حال تعذر GPS، نتصل مباشرة برقم الطوارئ
          if (phone) {
            window.location.href = `tel:${phone}`;
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }, [emergencyPhone, guardianName, locationName, speak, triggerHaptic]);

  // 3. إلغاء الطوارئ بواسطة الكفيف
  const handleUserCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    speak("الحمد لله على سلامتك. تم إلغاء نداء الاستغاثة وأنت بخير.");
    triggerHaptic("success");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleUserCancel}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-red-950/95 p-6 backdrop-blur-md animate-pulse-subtle cursor-pointer select-none"
      role="alertdialog"
      aria-modal="true"
      aria-label="تنبيه رصد سقوط مفاجئ - اضغط في أي مكان بالشاشة للإلغاء"
    >
      {/* رأس التنبيه */}
      <div className="w-full text-center mt-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-600/30 border-4 border-red-500 rounded-full flex items-center justify-center animate-bounce">
          <AlertOctagon className="w-12 h-12 text-red-400 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">رصد سقوط مفاجئ!</h2>
        <p className="text-sm text-red-200">
          استشعر الهاتف ارتطاماً وسكوناً. هل أنت بخير؟
        </p>
      </div>

      {/* العداد التنازلي الضخم */}
      <div className="my-auto text-center">
        <div className="w-32 h-32 rounded-full border-8 border-red-500/80 bg-red-900/60 flex flex-col items-center justify-center shadow-2xl mx-auto">
          <span className="text-5xl font-black text-white tracking-wider">{countdown}</span>
          <span className="text-xs text-red-300 font-bold">ثانية</span>
        </div>
        <p className="text-xs text-red-300 mt-4 max-w-xs mx-auto">
          سيتم إرسال نداء استغاثة فوري لـ <strong>{guardianName || "ولي الأمر"}</strong> والاتصال به تلقائياً عند الصفر.
        </p>
      </div>

      {/* زر الأمان الضخم - يملأ أسفل الشاشة بالكامل ليسهل لمسه */}
      <div className="w-full max-w-sm mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUserCancel();
          }}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-dark-900 text-lg font-black rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border-4 border-emerald-300"
          aria-label="أنا بخير - اضغط هنا لإلغاء نداء الطوارئ فوراً"
        >
          <Check className="w-7 h-7 stroke-[3]" />
          <span>أنا بخير والحمد لله (إلغاء)</span>
        </button>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          (يمكنك أيضاً النقر في أي مكان على الشاشة)
        </p>
      </div>
    </div>
  );
}
