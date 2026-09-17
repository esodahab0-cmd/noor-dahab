"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  Lock
} from "lucide-react";

export default function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [pendingBackup, setPendingBackup] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleDownloadBackup = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/backup/export");
      if (!res.ok) throw new Error("تعذر تحميل النسخة الاحتياطية من السيرفر.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noor-dahab-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "تم تصدير وتحميل النسخة الاحتياطية بنجاح على جهازك!" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "حدث خطأ أثناء التصدير." });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.collections) {
          throw new Error("تنسيق الملف غير صحيح أو لا يحتوي على بيانات نور دهب.");
        }
        setPendingBackup(json);
        setMessage({
          type: "info",
          text: `تم فحص الملف بنجاح: يحتوي على (${json.collections?.users?.length || 0}) مستخدمين و (${json.collections?.config?.length || 0}) ملفات إعدادات. اضغط 'استعادة الآن' للبدء.`,
        });
      } catch (err: any) {
        setPendingBackup(null);
        setMessage({ type: "error", text: "الملف غير صالح: " + err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreNow = async () => {
    if (!pendingBackup) return;
    setRestoring(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupData: pendingBackup }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشلت استعادة البيانات.");
      }

      setMessage({
        type: "success",
        text: `تمت الاستعادة بنجاح! تم استرجاع (${data.restoredCounts?.users || 0}) حساب مستخدم و (${data.restoredCounts?.config || 0}) إعدادات نظام.`,
      });
      setPendingBackup(null);
      setFileName("");
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "حدث خطأ أثناء الاسترجاع." });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl w-full min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <Database className="w-7 h-7 sm:w-8 sm:h-8 text-gold-400" />
          النسخ الاحتياطي والاسترجاع
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          حفظ وتأمين قاعدة بيانات النظام بالكامل بضغطة زر واحدة واسترجاعها في حالات الطوارئ.
        </p>
      </div>

      {/* Status Notifications */}
      {message && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3 transition-all ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : message.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : message.type === "error" ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <FileJson className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm font-bold leading-relaxed">{message.text}</span>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Export / Download */}
        <div className="p-6 sm:p-8 bg-dark-800 border-2 border-gold-500/30 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-gold-500/20 text-gold-400 rounded-2xl w-fit">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">تحميل نسخة احتياطية فورية (Export)</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              يقوم بتوليد ملف JSON منظم يحتوي على كافة حسابات المكفوفين، جهات اتصال الطوارئ، وتكوينات مفاتيح الذكاء الاصطناعي مع طابع زمني دقيق.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-gold-600 to-amber-600 hover:from-gold-500 hover:to-amber-500 active:scale-95 text-dark-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all"
          >
            {downloading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {downloading ? "جارٍ إعداد النسخة..." : "تنزيل النسخة الاحتياطية الآن"}
          </button>
        </div>

        {/* Card 2: Import / Restore */}
        <div className="p-6 sm:p-8 bg-dark-800 border-2 border-emerald-500/30 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl w-fit">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">استرجاع النظام من نسخة (Restore)</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              ارفع ملف النسخة الاحتياطية لاستعادة كافة الحسابات والإعدادات تلقائياً مع التحقق الصارم من صحة البيانات وعدم تكرار السجلات.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block w-full cursor-pointer">
              <div className="p-4 border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-2xl text-center transition-all bg-dark-700/40">
                <span className="text-xs text-gray-300 font-bold block truncate">
                  {fileName ? `الملف المختار: ${fileName}` : "اضغط لاختيار ملف النسخة (.json)"}
                </span>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {pendingBackup && (
              <button
                onClick={handleRestoreNow}
                disabled={restoring}
                className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all animate-pulse"
              >
                {restoring ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {restoring ? "جارٍ استعادة البيانات..." : "تأكيد واستعادة البيانات الآن"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security Information Panel */}
      <div className="p-6 sm:p-8 bg-dark-800 border border-gray-800 rounded-3xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          معايير الأمان والتشفير المطبقة في النظام
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 bg-dark-700/50 rounded-2xl border border-gray-700/50 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              حماية المفاتيح 100%
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              كافة مفاتيح Google Gemini و Cloudflare معزولة تماماً في خوادم Next.js API ولا تصل أبداً للمتصفح.
            </p>
          </div>

          <div className="p-4 bg-dark-700/50 rounded-2xl border border-gray-700/50 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              قفل النطاق CORS Locking
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              حظر أي طلبات خارجية مشبوهة، والسماح حصرياً لـ dahabsoftware.online ونطاقات التطوير الرسمية.
            </p>
          </div>

          <div className="p-4 bg-dark-700/50 rounded-2xl border border-gray-700/50 space-y-1.5">
            <div className="flex items-center gap-2 text-gold-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              مكافحة الإغراق Rate Limiting
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              حماية السيرفر من هجمات الحرمان من الخدمة بتحديد حد أقصى 20 طلباً في الدقيقة لكل عنوان IP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
