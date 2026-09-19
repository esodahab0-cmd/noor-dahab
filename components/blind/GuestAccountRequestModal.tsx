"use client";

import { Phone, MessageCircle, LogOut, X, Sparkles, UserCheck } from "lucide-react";
import Image from "next/image";

interface GuestAccountRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function GuestAccountRequestModal({
  isOpen,
  onClose,
  onLogout,
}: GuestAccountRequestModalProps) {
  if (!isOpen) return null;

  const adminPhone = "01064147224"; // رقم المهندس إسلام أبو دهب
  const cleanPhone = "201064147224";
  const whatsappMsg = encodeURIComponent(
    "السلام عليكم يا بشمهندس إسلام، أنا أستخدم تطبيق نور دهب كزائر وأرغب في إنشاء حساب رسمي ومفعل لي ولعائلتي."
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-dark-800 border-2 border-gold-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-500/20 border-2 border-gold-500/50 flex items-center justify-center text-gold-400 shadow-lg">
          <UserCheck className="w-9 h-9 animate-pulse" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white">حساب الزائر المؤقت</h2>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            أنت مسجل الآن كـ <span className="text-gold-400 font-bold">زائر تجريبي</span>. للحصول على حساب دائم غير محدود الصلاحيات مع ربط رقم ولي أمرك، تواصل مع المطور:
          </p>
          <div className="mt-3 p-2 bg-dark-900 rounded-xl border border-gray-700 text-xs">
            <p className="text-gold-300 font-bold">م/ إسلام أبو دهب (Dahab Software)</p>
            <p className="text-gray-400 font-mono text-[11px]">{adminPhone}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Direct */}
          <a
            href={`https://wa.me/${cleanPhone}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            طلب حساب عبر واتساب
          </a>

          {/* Direct Phone Call */}
          <a
            href={`tel:${adminPhone}`}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-5 h-5" />
            اتصال هاتفي مباشر
          </a>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 active:scale-95 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج والعودة لصفحة الدخول
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-xs mx-auto pt-1"
        >
          <X className="w-4 h-4" />
          متابعة التجربة كزائر
        </button>
      </div>
    </div>
  );
}
