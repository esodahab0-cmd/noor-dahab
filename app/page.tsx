"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Volume2, VolumeX, Mic, Navigation, RefreshCw, LogOut,
  Eye, FileText, Banknote, Pill, Users, AlertTriangle, Crosshair,
  Camera, MapPin, ShieldCheck, UserPlus, UserCheck, Save, Zap, Radio
} from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useSingleSession } from "@/lib/hooks/useSingleSession";
import { compressImage } from "@/lib/utils/image";
import { PWAInstallPrompt } from "@/components/blind/PWAInstallPrompt";
import { EmergencySOSModal } from "@/components/blind/EmergencySOSModal";
import { saveFaceLocally, getAllSavedFaces, SavedFace } from "@/lib/utils/faces-db";

export default function BlindHomePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);
  const autoScanTimerRef = useRef<any>(null);

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    isListening,
    unlockSpeaker,
    isAudioUnlocked,
    playChime
  } = useSpeech();

  const { triggerHaptic } = useHaptic();
  useSingleSession();

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState("المس الشاشة لوصف فوري لما أمامك.");
  const [activeTier, setActiveTier] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({});
  const [permState, setPermState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  // Save Face Modal / Voice State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [capturedFaceBase64, setCapturedFaceBase64] = useState("");
  const [personNameInput, setPersonNameInput] = useState("");
  const [savedFaces, setSavedFaces] = useState<SavedFace[]>([]);

  // ── Load Saved Faces ──────────────────────────────────────────
  const loadFaces = useCallback(async () => {
    const list = await getAllSavedFaces();
    setSavedFaces(list);
  }, []);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  // ── Speaker Unlock Handler ───────────────────────────────────
  const handleUnlockSpeaker = () => {
    unlockSpeaker();
    triggerHaptic("medium");
    setTimeout(() => {
      speak("تم تشغيل مكبر الصوت. نور دهب يتحدث معك الآن بكل وضوح.");
    }, 150);
  };

  // ── Start Camera ──────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
      return true;
    } catch (err: any) {
      const msg = err.name === "NotAllowedError"
        ? "تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح."
        : "لم يتم العثور على كاميرا أو حدث خطأ: " + err.message;
      setCameraError(msg);
      speak(msg);
      return false;
    }
  }, [speak]);

  // ── Request all permissions at startup ──────────────────────
  const requestPermissions = useCallback(async () => {
    setPermState("requesting");
    unlockSpeaker(); // unlock audio on first user touch!
    speak("جارٍ تشغيل الكاميرا والموقع ومكبر الصوت...");

    const camOk = await startCamera();

    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocationCoords({ lat, lon });
        try {
          const res = await fetch(`/api/geo?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.success) {
            setLocationName(data.address);
          }
        } catch {}
      },
      (err) => {
        console.warn("Geolocation denied:", err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    setPermState(camOk ? "granted" : "denied");
    if (camOk) {
      setTimeout(() => {
        speak("الكاميرا ومكبر الصوت جاهزان. نور دهب في خدمتك. المس الشاشة في أي مكان أو تحدث للوصف الفوري.");
      }, 500);
    }
  }, [startCamera, speak, unlockSpeaker]);

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("noor_user");
    if (!raw) { router.push("/login"); return; }
    const user = JSON.parse(raw);
    setUserProfile(user);

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(autoScanTimerRef.current);
    };
  }, [router]);

  // ── Save Face Trigger ────────────────────────────────────────
  const triggerSaveFace = async () => {
    if (!videoRef.current || !cameraReady) {
      speak("يرجى فتح الكاميرا أولاً.");
      return;
    }
    triggerHaptic("medium");
    try {
      const base64 = await compressImage(videoRef.current, 512, 0.7);
      setCapturedFaceBase64(base64);
      setIsSaveModalOpen(true);
      speak("تم التقاط الصورة. تفضل بإملاء اسم الشخص بصوتك الآن.");

      setTimeout(() => {
        startListening((dictatedName) => {
          if (dictatedName && dictatedName.length > 1) {
            setPersonNameInput(dictatedName);
            saveFaceFinal(dictatedName, base64);
          }
        });
      }, 2000);
    } catch (e: any) {
      speak("حدث خطأ أثناء التقاط الصورة.");
    }
  };

  const saveFaceFinal = async (name: string, base64: string) => {
    if (!name.trim()) return;
    try {
      await saveFaceLocally({ name, imageBase64: base64, relation: "شخص مقرب" });
      triggerHaptic("success");
      speak(`تم حفظ صورة ${name} على هاتفك بنجاح. سأتعرف عليه فوراً عند رؤيته.`);
      setIsSaveModalOpen(false);
      setPersonNameInput("");
      setCapturedFaceBase64("");
      await loadFaces();
    } catch (e: any) {
      speak("حدث خطأ في حفظ الصورة.");
    }
  };

  // ── Analyze Vision (Ultra-Fast 512px) ───────────────────────
  const handleAnalyze = async (
    mode: "general" | "read_text" | "currency" | "location" | "medication" | "faces" | "obstacle" = "general",
    silentPrompt = false
  ) => {
    if (analyzing) return;
    if (!cameraReady) {
      speak("يرجى تفعيل الكاميرا أولاً.");
      return;
    }

    triggerHaptic("light");
    playChime(660, 0.1);
    setAnalyzing(true);
    stopSpeaking();

    if (!silentPrompt) {
      const labels: Record<string, string> = {
        general: "أرى الآن...",
        read_text: "أقرأ النص...",
        currency: "أفحص العملة...",
        medication: "أفحص الدواء...",
        faces: "أتعرف على الشخص...",
        obstacle: "أرصد الطريق والعوائق...",
        location: "أحدد المكان...",
      };
      speak(labels[mode]);
    }

    try {
      if (!videoRef.current) throw new Error("الكاميرا غير جاهزة");
      // Fast lightweight image compression (< 40KB) for instantaneous response
      const base64 = await compressImage(videoRef.current, 512, 0.65);
      const user = JSON.parse(localStorage.getItem("noor_user") || "{}");
      const token = localStorage.getItem("noor_session_token") || "";
      const registeredFaces = savedFaces.map(f => ({ name: f.name, description: f.relation || "شخص مقرب" }));

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
          "x-username": user.username || "",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mode,
          locationInfo: { addressText: locationName },
          registeredFaces,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.text || data.error || "تعذر التحليل");

      triggerHaptic("success");
      setCurrentResult(data.text);
      setActiveTier(data.provider || "gemini");
      speak(data.text);
    } catch (err: any) {
      triggerHaptic("error");
      const msg = err.message || "حدث خطأ أثناء فحص الصورة.";
      setCurrentResult(msg);
      speak(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Auto Scan Mode ("اول ما يري شئ يوصفه") ───────────────────
  useEffect(() => {
    if (autoScanEnabled && cameraReady) {
      speak("تم تفعيل وضع الوصف التلقائي المستمر. سأصف ما أمامك أولاً بأول.");
      autoScanTimerRef.current = setInterval(() => {
        handleAnalyze("general", true);
      }, 7000);
    } else {
      clearInterval(autoScanTimerRef.current);
    }
    return () => clearInterval(autoScanTimerRef.current);
  }, [autoScanEnabled, cameraReady]);

  // ── Center Tap with SOS (4 taps) ────────────────────────────
  const handleCenterTap = () => {
    if (!isAudioUnlocked) unlockSpeaker();
    if (permState === "idle" || permState === "denied") {
      requestPermissions();
      return;
    }
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 4) {
      tapCountRef.current = 0;
      triggerHaptic("error");
      setIsSOSOpen(true);
      speak("تم فتح نداء الاستغاثة والطوارئ.");
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      handleAnalyze("general");
    }, 300);
  };

  // ── Voice Command ("اوصف", "شايف إيه", "مين قدامي") ──────────
  const handleVoiceCommand = () => {
    unlockSpeaker();
    if (permState !== "granted") { speak("يرجى السماح بالكاميرا أولاً."); return; }
    triggerHaptic("light");
    speak("أسمعك الآن، تفضل...");
    startListening((transcript) => {
      triggerHaptic("medium");
      const lower = transcript.toLowerCase();

      if (/احفظ|سجل|تذكر|صورة شخص/.test(lower)) {
        triggerSaveFace();
      }
      else if (/نص|اقرأ|كلمة|ورقة|كتابة|لافتة/.test(lower)) {
        handleAnalyze("read_text");
      }
      else if (/فلوس|عملة|جنيه|ريال|دولار|نقود/.test(lower)) {
        handleAnalyze("currency");
      }
      else if (/دواء|علاج|صلاحية|روشتة|علبة|تاريخ/.test(lower)) {
        handleAnalyze("medication");
      }
      else if (/مين|شخص|صاحبي|وجه|أمامي|من هذا/.test(lower)) {
        handleAnalyze("faces");
      }
      else if (/عائق|طريق|قدامي|مسافة|سلم|حفرة/.test(lower)) {
        handleAnalyze("obstacle");
      }
      else if (/موقع|أين|مكاني|شارع|عنوان/.test(lower)) {
        handleAnalyze("location");
      }
      else if (/طوارئ|استغاثة|الحقني|مساعدة/.test(lower)) {
        setIsSOSOpen(true);
      }
      else if (/اسكت|وقف|صمت|كفاية/.test(lower)) {
        stopSpeaking();
      }
      else {
        // Any request like "اوصف اللي قدامي" / "شايف ايه" / "اوصفلي"
        handleAnalyze("general");
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden select-none touch-none">
      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        playsInline muted autoPlay
        className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-90 contrast-120 pointer-events-none"
      />

      {/* Top Bar */}
      <header className="relative z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-lg text-white tracking-wide">نور دهب</span>

          {/* Speaker Button */}
          <button
            onClick={handleUnlockSpeaker}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
              isAudioUnlocked
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-gold-500 text-dark-900 animate-bounce font-black border-gold-400"
            }`}
            aria-label="تفعيل الاسبيكر ومكبر الصوت"
          >
            <Volume2 className="w-3.5 h-3.5" />
            {isAudioUnlocked ? "الاسبيكر شغال" : "فتح الاسبيكر 🔊"}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Auto Scan Toggle */}
          <button
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
              autoScanEnabled
                ? "bg-blue-600 text-white border-blue-400 animate-pulse"
                : "bg-dark-800 text-gray-300 border-gray-700"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-gold-400" />
            {autoScanEnabled ? "وصف مستمر ⚡" : "وصف تلقائي"}
          </button>

          {/* SOS */}
          <button onClick={() => setIsSOSOpen(true)}
            className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-xl flex items-center gap-1 active:scale-95 shadow">
            <AlertTriangle className="w-3.5 h-3.5" />
            SOS
          </button>

          <button
            onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="p-1.5 bg-dark-800 border border-gray-700 text-gray-400 rounded-xl active:scale-95">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      <PWAInstallPrompt />

      {/* CENTER: Permissions / Scan Area */}
      <button type="button" onClick={handleCenterTap} disabled={analyzing}
        aria-label="اضغط لتصوير وشرح المشهد أو 4 مرات للطوارئ"
        className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center cursor-pointer outline-none active:scale-98 transition-transform">

        {/* Permission Request State */}
        {permState === "idle" && (
          <div className="flex flex-col items-center gap-4 p-6 bg-dark-800/95 rounded-3xl border-2 border-gold-500 shadow-2xl max-w-xs w-full">
            <div className="flex gap-3">
              <div className="p-3 bg-gold-500/20 text-gold-400 rounded-2xl border border-gold-500/30">
                <Camera className="w-8 h-8" />
              </div>
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Volume2 className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white mb-1">اضغط لبدء نور دهب</h2>
              <p className="text-xs text-gray-300">لتفعيل الكاميرا ومكبر الصوت والتحدث معك فوراً.</p>
            </div>
            <button onClick={requestPermissions}
              className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-dark-900 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 animate-pulse">
              <ShieldCheck className="w-6 h-6" />
              تشغيل الكاميرا والاسبيكر
            </button>
          </div>
        )}

        {permState === "requesting" && (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-16 h-16 text-gold-400 animate-spin" />
            <p className="text-white font-bold text-lg">جارٍ تشغيل الكاميرا والاسبيكر...</p>
            <p className="text-gray-400 text-sm">اضغط "سماح" في نافذة المتصفح</p>
          </div>
        )}

        {permState === "denied" && (
          <div className="flex flex-col items-center gap-4 p-6 bg-red-950/90 rounded-3xl border-2 border-red-500/50 max-w-xs w-full">
            <Camera className="w-12 h-12 text-red-400" />
            <p className="text-white font-bold text-center text-sm">{cameraError || "يرجى منح إذن الكاميرا من المتصفح"}</p>
            <button onClick={requestPermissions}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              حاول مجدداً
            </button>
          </div>
        )}

        {permState === "granted" && (
          <>
            <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-2xl mb-3 ${
              analyzing ? "border-blue-400 bg-blue-500/20" : "border-gold-400 bg-gold-500/20 gold-glow"
            }`}>
              {analyzing
                ? <RefreshCw className="w-12 h-12 text-blue-300 animate-spin" />
                : <Eye className="w-12 h-12 text-gold-400 animate-pulse" />
              }
            </div>

            <p className="text-lg font-black text-white max-w-sm leading-relaxed px-4 py-2 bg-black/85 rounded-2xl border border-gold-500/30 text-center shadow-lg">
              {analyzing ? "جارٍ التحليل السريع..." : currentResult}
            </p>

            <span className="mt-2 text-[11px] font-bold text-gold-300/90 bg-black/70 px-3 py-1 rounded-full border border-white/10">
              المس الشاشة لوصف فوري • أو اضغط "أمر صوتي"
            </span>
          </>
        )}
      </button>

      {/* Bottom Action Buttons */}
      {permState === "granted" && (
        <footer className="relative z-20 px-3 pb-4 pt-1 bg-gradient-to-t from-black/95 via-black/85 to-transparent flex flex-col gap-2">
          {locationName && (
            <div className="flex items-center gap-2 text-[11px] text-gray-300 bg-black/80 border border-gray-800 px-3 py-1 rounded-xl">
              <Navigation className="w-3 h-3 text-gold-400 shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { mode: "read_text" as const, icon: <FileText className="w-4 h-4 text-gold-400" />, label: "اقرأ نص", border: "border-gold-500/40" },
              { mode: "currency" as const, icon: <Banknote className="w-4 h-4 text-emerald-400" />, label: "فلوس", border: "border-emerald-500/40" },
              { mode: "medication" as const, icon: <Pill className="w-4 h-4 text-purple-400" />, label: "دواء", border: "border-purple-500/40" },
              { mode: "faces" as const, icon: <Users className="w-4 h-4 text-blue-400" />, label: "مين قدامي؟", border: "border-blue-500/40" },
            ].map(btn => (
              <button key={btn.mode} onClick={() => handleAnalyze(btn.mode)} disabled={analyzing}
                className={`flex flex-col items-center justify-center p-2 bg-dark-800 border ${btn.border} rounded-2xl active:scale-95 text-white font-bold`}>
                {btn.icon}
                <span className="text-[10px] mt-1">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={triggerSaveFace} disabled={analyzing}
              className="flex items-center justify-center gap-1 p-2.5 bg-blue-900/40 border border-blue-500/50 rounded-2xl active:scale-95 text-blue-300 font-bold text-xs">
              <UserPlus className="w-4 h-4 text-blue-400" />
              احفظ شخص
            </button>

            {/* Voice Input Button */}
            <button onClick={handleVoiceCommand} disabled={analyzing || isListening}
              className={`flex items-center justify-center gap-1 p-2.5 border rounded-2xl font-black text-xs transition-all ${
                isListening
                  ? "bg-red-500 border-red-400 text-white animate-pulse shadow-lg scale-105"
                  : "bg-gold-500/25 border-gold-500 text-gold-300 active:scale-95"
              }`}>
              <Mic className="w-4 h-4" />
              {isListening ? "أسمعك الآن..." : "أمر صوتي 🎙️"}
            </button>

            <button onClick={stopSpeaking}
              className="flex items-center justify-center gap-1 p-2.5 bg-dark-800 border border-red-500/40 rounded-2xl active:scale-95 text-white font-bold text-xs">
              {isSpeaking ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
              إسكات
            </button>
          </div>
        </footer>
      )}

      {/* Save Face Dictation Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="bg-dark-800 border-2 border-blue-500/50 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-400" />
              حفظ شخص في الذاكرة
            </h3>

            {capturedFaceBase64 && (
              <img src={capturedFaceBase64} alt="Captured Face" className="w-32 h-32 object-cover rounded-2xl mx-auto border-2 border-blue-500/40" />
            )}

            <p className="text-xs text-gray-300">املاء الاسم بصوتك أو اكتبه أدناه:</p>

            <input
              type="text"
              value={personNameInput}
              onChange={(e) => setPersonNameInput(e.target.value)}
              placeholder="مثال: والدي أحمد"
              className="w-full px-4 py-3 bg-dark-700 border border-gray-700 rounded-xl text-white font-bold text-center text-base"
            />

            <div className="flex gap-2">
              <button onClick={() => saveFaceFinal(personNameInput, capturedFaceBase64)}
                disabled={!personNameInput.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> حفظ
              </button>
              <button onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency SOS Modal */}
      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        locationName={locationName}
        emergencyPhone={userProfile?.emergencyPhone || ""}
        guardianName={userProfile?.guardianName || ""}
      />
    </main>
  );
}