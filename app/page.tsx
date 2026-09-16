"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Volume2, VolumeX, Mic, Navigation, RefreshCw, LogOut,
  Eye, FileText, Banknote, Pill, Users, AlertTriangle,
  Camera, ShieldCheck, UserPlus, Save, Zap, Flashlight,
  Shirt, Search, Monitor, Bus, QrCode, RotateCcw,
  Moon, Gauge, WifiOff, Compass
} from "lucide-react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useSingleSession } from "@/lib/hooks/useSingleSession";
import { useDeviceSensors } from "@/lib/hooks/useDeviceSensors";
import { analyzeFrameForHazards } from "@/lib/utils/motion-radar";
import { compressImage } from "@/lib/utils/image";
import { AnalysisMode } from "@/lib/ai/types";
import { PWAInstallPrompt } from "@/components/blind/PWAInstallPrompt";
import { EmergencySOSModal } from "@/components/blind/EmergencySOSModal";
import { saveFaceLocally, getAllSavedFaces, SavedFace } from "@/lib/utils/faces-db";
import { scanBarcodeLocally } from "@/lib/utils/barcode";

export default function BlindHomePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);
  const autoScanTimerRef = useRef<any>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);
  const lastDescriptionRef = useRef<string>("أهلاً بك في نور دهب. المس الشاشة في أي مكان لبدء الوصف.");

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    isListening,
    unlockSpeaker,
    isAudioUnlocked,
    playChime,
    speechRate,
    cycleSpeechRate
  } = useSpeech();

  const { triggerHaptic } = useHaptic();
  useSingleSession();

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState("المس الشاشة لوصف ما أمامك، أو اضغط مطولاً للتحدث.");
  const [locationName, setLocationName] = useState("");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({});
  const [permState, setPermState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [activeMode, setActiveMode] = useState<AnalysisMode>("general");

  // Save Face Modal / Voice State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [capturedFaceBase64, setCapturedFaceBase64] = useState("");
  const [personNameInput, setPersonNameInput] = useState("");
  const [savedFaces, setSavedFaces] = useState<SavedFace[]>([]);
  const handleVoiceCommandRef = useRef<() => void>(() => {});
  const lastRadarWarningTimeRef = useRef<number>(0);

  const {
    isOnline,
    isWakeLockActive,
    requestWakeLock,
    isBlackoutMode,
    toggleBlackoutMode,
    compass,
  } = useDeviceSensors({
    onShake: () => {
      if (permState === "granted" && !analyzing && !isListening) {
        triggerHaptic("medium");
        handleVoiceCommandRef.current?.();
      }
    },
    onNetworkChange: (online) => {
      if (!online) {
        triggerHaptic("error");
        speak("انقطع الاتصال بالإنترنت. تم التبديل إلى وضع عدم الاتصال، رادار العوائق وقارئ الأكواد متاحان الآن بدون شبكة.");
      } else {
        triggerHaptic("success");
        speak("عاد الاتصال بالإنترنت بنجاح.");
      }
    }
  });

  // ── Audio Compass Announcer ──────────────────────────────────
  const announceCompassDirection = useCallback(() => {
    triggerHaptic("medium");
    playChime(660, 0.1);
    const locationPart = locationName ? ` في ${locationName}` : "";
    const msg = `أنت متجه الآن نحو ${compass.directionAr}، بزاوية ${compass.degrees} درجة${locationPart}.`;
    setCurrentResult(msg);
    speak(msg);
  }, [compass, locationName, triggerHaptic, playChime, speak]);

  // ── Walking Companion Co-Pilot Mode ──────────────────────────
  const [companionMode, setCompanionMode] = useState(false);
  const companionTimerRef = useRef<any>(null);

  const toggleCompanionMode = useCallback(() => {
    setCompanionMode((prev) => {
      const next = !prev;
      triggerHaptic("medium");
      if (next) {
        speak("تم تفعيل رفيق الطريق. سأرافقك وأصف لك مسار السير خطوة بخطوة باستمرار.");
      } else {
        speak("تم إيقاف وضع رفيق الطريق.");
      }
      return next;
    });
  }, [speak, triggerHaptic]);

  // ── Local Real-Time Hazard Radar (Zero-latency offline) ─────────
  useEffect(() => {
    if (!cameraReady) return;

    const radarTimer = setInterval(() => {
      if (!videoRef.current || analyzing || isListening) return;
      const res = analyzeFrameForHazards(videoRef.current);
      if (res.hazardDetected) {
        const now = Date.now();
        if (now - lastRadarWarningTimeRef.current > 3500) {
          lastRadarWarningTimeRef.current = now;
          triggerHaptic("error");
          playChime(920, 0.15);
          setCurrentResult(res.message);
          speak(res.message);
        }
      }
    }, 250);

    return () => clearInterval(radarTimer);
  }, [cameraReady, analyzing, isListening, speak, triggerHaptic, playChime]);

  // ── Load Saved Faces ──────────────────────────────────────────
  const loadFaces = useCallback(async () => {
    const list = await getAllSavedFaces();
    setSavedFaces(list);
  }, []);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  // ── Torch / Flashlight Controller ────────────────────────────
  const setTorch = useCallback(async (state: boolean, notify = true) => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track && "applyConstraints" in track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          await (track as any).applyConstraints({ advanced: [{ torch: state }] });
          setTorchOn(state);
          if (notify) {
            triggerHaptic("medium");
            speak(state ? "تم تشغيل كشاف الكاميرا." : "تم إطفاء الكشاف.");
          }
          return true;
        }
      }
    } catch (e) {}
    return false;
  }, [speak, triggerHaptic]);

  // ── Speaker Unlock Handler ───────────────────────────────────
  const handleUnlockSpeaker = () => {
    unlockSpeaker();
    triggerHaptic("medium");
    setTimeout(() => {
      speak("تم تشغيل مكبر الصوت. نور دهب يتحدث معك الآن بكل وضوح.");
    }, 150);
  };

  // ── Repeat Last Description ─────────────────────────────────
  const handleRepeatLast = useCallback(() => {
    unlockSpeaker();
    triggerHaptic("medium");
    playChime(523.25, 0.1);
    if (lastDescriptionRef.current) {
      speak(lastDescriptionRef.current);
    } else {
      speak("لا يوجد وصف سابق بعد. المس الشاشة لوصف ما أمامك.");
    }
  }, [speak, triggerHaptic, playChime, unlockSpeaker]);

  // ── Robust Camera Initialization ─────────────────────────────
  const requestPermissions = async () => {
    setPermState("requesting");
    setCameraError("");
    unlockSpeaker();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg = "المتصفح لا يدعم الكاميرا أو الصفحة مفتوحة برابط غير آمن.";
      setCameraError(msg);
      setPermState("denied");
      speak(msg);
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    const attempts = [
      { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: "environment" }, audio: false },
      { video: true, audio: false }
    ];

    for (const constraint of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (stream) break;
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!stream) {
      const isDenied = lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError";
      const msg = isDenied
        ? "تم رفض إذن الكاميرا. يرجى الضغط على القفل بجانب الرابط أعلى المتصفح واختيار السماح للكاميرا ثم تحديث الصفحة."
        : "تعذر تشغيل الكاميرا: " + (lastErr?.message || "يرجى التحقق من إعدادات الهاتف");
      setCameraError(msg);
      setPermState("denied");
      speak(msg);
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      const vid = videoRef.current;
      vid.muted = true;
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("webkit-playsinline", "true");
      vid.srcObject = stream;

      try {
        await vid.play();
      } catch (playErr) {
        vid.onloadedmetadata = () => {
          vid.play().catch(() => {});
        };
      }
    }

    setCameraReady(true);
    setPermState("granted");
    unlockSpeaker();
    requestWakeLock();

    // Pre-request microphone permission so voice commands work instantly without extra prompts
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(t => t.stop());
      }
    } catch (micErr) {
      console.warn("Microphone initial permission warmup:", micErr);
    }

    setTimeout(() => {
      speak("تم تشغيل الكاميرا والميكروفون بنجاح. نور دهب في خدمتك الآن. المس الشاشة للوصف أو اضغط تحدث لأي سؤال.");
    }, 200);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
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
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // ── Hardware Keys Listener (Volume Buttons / Headsets) ───────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "AudioVolumeUp" ||
        e.code === "AudioVolumeDown" ||
        e.code === "MediaPlayPause" ||
        e.key === "VolumeUp" ||
        e.key === "VolumeDown"
      ) {
        if (permState === "granted" && !analyzing) {
          e.preventDefault();
          triggerHaptic("medium");
          handleAnalyze(activeMode);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [permState, analyzing, activeMode]);

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
      speak("يرجى تشغيل الكاميرا أولاً.");
      return;
    }
    triggerHaptic("medium");
    try {
      const { base64 } = await compressImage(videoRef.current, 400, 0.55);
      setCapturedFaceBase64(base64);
      setIsSaveModalOpen(true);
      speak("تم التقاط الصورة. تفضل بنطق اسم هذا الشخص بصوتك الآن.");

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
      speak(`تم حفظ صورة ${name} بنجاح. سأتعرف عليه فوراً عند رؤيته أمامك.`);
      setIsSaveModalOpen(false);
      setPersonNameInput("");
      setCapturedFaceBase64("");
      await loadFaces();
    } catch (e: any) {
      speak("حدث خطأ في حفظ الصورة.");
    }
  };

  // ── Announce Current Location Spoken Directly ────────────────
  const announceCurrentLocation = useCallback(async () => {
    triggerHaptic("medium");
    playChime(660, 0.1);
    speak("جارٍ تحديد موقعك واسم الشارع بدقة...");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      speak("خاصية تحديد الموقع غير مدعومة في جهازك.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocationCoords({ lat, lon });
        try {
          const res = await fetch(`/api/geo?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.success && data.address) {
            setLocationName(data.address);
            const msg = `أنت متواجد حالياً في: ${data.address}`;
            lastDescriptionRef.current = msg;
            setCurrentResult(msg);
            speak(msg);
          } else {
            speak("تم رصد إحداثيات موقعك، لكن تعذر جلب اسم الشارع حالياً.");
          }
        } catch {
          speak("تعذر الاتصال بخدمة الخرائط لتحديد اسم الشارع.");
        }
      },
      (err) => {
        speak("يرجى تفعيل خدمة الـ GPS والموقع في هاتفك لسماع اسم الشارع.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [speak, triggerHaptic, playChime]);

  // ── Analyze Vision (All 11 Modes) ────────────────────────────
  const handleAnalyze = async (
    mode: AnalysisMode = "general",
    silentPrompt = false,
    userQuestion?: string
  ) => {
    if (analyzing) return;
    if (!cameraReady) {
      speak("يرجى تشغيل الكاميرا أولاً.");
      return;
    }

    setActiveMode(mode);
    triggerHaptic("light");
    playChime(660, 0.1);
    setAnalyzing(true);
    stopSpeaking();

    // If offline and not using local barcode scanner, alert user
    if (typeof navigator !== "undefined" && !navigator.onLine && mode !== "barcode") {
      setAnalyzing(false);
      const msg = "أنت في وضع عدم الاتصال حالياً. يمكنك مسح الباركود والاعتماد على رادار العوائق بدون إنترنت.";
      speak(msg);
      setCurrentResult("وضع عدم الاتصال: متاح قراءة الباركود ورادار العوائق.");
      return;
    }

    if (!silentPrompt && !userQuestion) {
      const labels: Record<AnalysisMode, string> = {
        general: "أرى الآن...",
        read_text: "أقرأ لك محتوى الورقة والكتابة بدقة...",
        currency: "أعد النقود وأحسب المبلغ...",
        medication: "أفحص الدواء والروشتة...",
        faces: "أتعرف على الشخص...",
        obstacle: "أرصد الطريق والعوائق...",
        location: "أحدد المكان والممرات...",
        colors: "أفحص ألوان وتناسق الملابس...",
        find_object: "أبحث عن الشيء المفقود...",
        appliance: "أقرأ شاشة الجهاز والأرقام...",
        transit: "أرصد لافتة المواصلات والأتوبيس...",
        barcode: "أقرأ باركود وبيانات المنتج...",
        companion: "أرافقك في الطريق...",
      };
      speak(labels[mode] || "أفحص الصورة...");
    }

    try {
      if (!videoRef.current) throw new Error("الكاميرا غير جاهزة");

      // Fast Local Barcode / QR Code Scanner (zero AI cost, instant response)
      if (mode === "barcode") {
        try {
          const detectedCode = await scanBarcodeLocally(videoRef.current);
          if (detectedCode) {
            triggerHaptic("success");
            playChime(523.25, 0.1);
            const isUrl = detectedCode.startsWith("http://") || detectedCode.startsWith("https://");
            const resultMsg = isUrl
              ? `تم قراءة رمز الاستجابة السريعة: رابط إلكتروني إلى: ${detectedCode}`
              : `تم قراءة الكود بنجاح: ${detectedCode}`;
            lastDescriptionRef.current = resultMsg;
            setCurrentResult(resultMsg);
            speak(resultMsg);
            setAnalyzing(false);
            return;
          }
        } catch (e) {
          console.warn("Local barcode scanner skipped, falling back to AI:", e);
        }
      }

      // High-resolution adaptive capture (1024px for reading/currency/barcode/meds or custom question, 720px for general)
      const captureWidth = ["read_text", "currency", "medication", "barcode", "appliance"].includes(mode) || !!userQuestion ? 1024 : 720;
      const { base64, isDark } = await compressImage(videoRef.current, captureWidth, 0.82);

      // Auto-Torch if environment is dark
      if (isDark && !torchOn) {
        setTorch(true, false);
      }

      const user = JSON.parse(localStorage.getItem("noor_user") || "{}");
      const token = localStorage.getItem("noor_session_token") || "";
      const registeredFaces = savedFaces.map(f => ({ name: f.name, description: f.relation || "شخص مقرب" }));

      const locationWithCompass = [
        locationName,
        compass?.directionAr ? `متجه نحو ${compass.directionAr} (${compass.degrees} درجة)` : ""
      ].filter(Boolean).join(" • ");

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
          locationInfo: { addressText: locationWithCompass },
          registeredFaces,
          userQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.text || data.error || "تعذر التحليل");

      // Warning check for safety obstacles
      const isObstacleOrRisk = /خطر|عائق|انتبه|حفرة|سلم|عقبة|باب مغلق|سيارة|احذر/.test(data.text);
      if (isObstacleOrRisk) {
        triggerHaptic("error");
        playChime(880, 0.15);
        setTimeout(() => playChime(440, 0.25), 180);
      } else {
        triggerHaptic("success");
        playChime(523.25, 0.1);
      }

      lastDescriptionRef.current = data.text;
      setCurrentResult(data.text);
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

  // ── Auto Scan Mode ──────────────────────────────────────────
  useEffect(() => {
    if (autoScanEnabled && cameraReady) {
      speak("تم تفعيل الوصف التلقائي المستمر.");
      autoScanTimerRef.current = setInterval(() => {
        handleAnalyze(activeMode, true);
      }, 6500);
    } else {
      clearInterval(autoScanTimerRef.current);
    }
    return () => clearInterval(autoScanTimerRef.current);
  }, [autoScanEnabled, cameraReady, activeMode]);

  // ── Walking Companion Co-Pilot Continuous Loop ───────────────
  useEffect(() => {
    if (companionMode && cameraReady) {
      companionTimerRef.current = setInterval(() => {
        if (!videoRef.current || analyzing || isListening || isSpeaking) return;
        handleAnalyze("companion", true);
      }, 4800);
    } else {
      clearInterval(companionTimerRef.current);
    }
    return () => clearInterval(companionTimerRef.current);
  }, [companionMode, cameraReady, analyzing, isListening, isSpeaking]);

  // ── Full-Screen Long Press & Tap Handlers ───────────────────
  const handlePointerDown = () => {
    isLongPressRef.current = false;
    clearTimeout(longPressTimerRef.current);
    if (permState === "granted") {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        triggerHaptic("medium");
        handleVoiceCommand();
      }, 550);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimerRef.current);
  };

  const handleCenterTap = () => {
    if (isLongPressRef.current) return;
    if (!isAudioUnlocked) unlockSpeaker();
    if (permState !== "granted") {
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
      handleAnalyze(activeMode);
    }, 300);
  };

  // ── Comprehensive Voice Assistant Command Processor ─────────
  const handleVoiceCommand = () => {
    unlockSpeaker();
    if (permState !== "granted") {
      speak("يرجى تشغيل الكاميرا والميكروفون أولاً بالضغط على زر البدء.");
      return;
    }
    stopSpeaking();
    triggerHaptic("medium");
    playChime(784, 0.12);
    setCurrentResult("🎙️ أسمعك الآن... تفضل بالتحدث");

    startListening((transcript) => {
      triggerHaptic("success");
      playChime(880, 0.1);
      const cleanTranscript = transcript.trim();
      const lower = cleanTranscript.toLowerCase();

      setCurrentResult(`سمعتك تقول: "${cleanTranscript}"`);

      // 1. Repeat last description
      if (/أعد|كرر|قول تاني|سمعني تاني|قل مرة أخرى|تاني|إعادة/.test(lower)) {
        handleRepeatLast();
        return;
      }

      // 2. Creator credits
      if (/مين صاحب|صاحب الموقع|صاحب الفكرة|مين صنعك|مين طورك|مين برمجك|مين عملك|إسلام|اسلام|دهب سوفتوير|المطور/.test(lower)) {
        const creatorMsg = "مبتكر ومطور تطبيق نور دهب وصاحب الفكرة هو المهندس إسلام أبو دهب، والتطبيق تابع لشركة دهب سوفتوير Dahab Software.";
        setCurrentResult("المطور: المهندس إسلام أبو دهب • Dahab Software");
        speak(creatorMsg);
        return;
      }

      // 3. Torch controls
      if (/كشاف|فلاش|نور|شغل الكشاف|شغل الفلاش/.test(lower) && !/اطفي|إطفاء|اقفل/.test(lower)) {
        setTorch(true);
        speak("تم تشغيل الكشاف.");
        return;
      }
      if (/اطفي الكشاف|اقفل الكشاف|اطفي الفلاش|إطفاء النور/.test(lower)) {
        setTorch(false);
        speak("تم إطفاء الكشاف.");
        return;
      }

      // 4. Location & Street Voice Command
      if (/موقع|أين أنا|مكاني|شارع|عنوان|أنا فين|فين أنا/.test(lower)) {
        announceCurrentLocation();
        return;
      }

      // 4.1 Compass Heading & Direction
      if (/بوصلة|اتجاه|متجه فين|رايح فين|فين القبلة|شمال ولا جنوب|قبلة/.test(lower)) {
        announceCompassDirection();
        return;
      }

      // 4.2 Companion Mode (رفيق الطريق والمرافقة المستمرة)
      if (/شغل رفيق الطريق|رفيق الطريق|امشي معايا|خليك معايا|مرافق/.test(lower) && !/اطفي|إطفاء|اقفل|وقف/.test(lower)) {
        if (!companionMode) toggleCompanionMode();
        return;
      }
      if (/اطفي رفيق الطريق|اقفل رفيق الطريق|وقف رفيق الطريق|كفاية رفيق/.test(lower)) {
        if (companionMode) toggleCompanionMode();
        return;
      }

      // 5. Emergency SOS
      if (/طوارئ|استغاثة|الحقني|مساعدة|اس او اس/.test(lower)) {
        setIsSOSOpen(true);
        speak("تم فتح نداء الاستغاثة والطوارئ.");
        return;
      }

      // 6. Stop speaking
      if (/اسكت|وقف|صمت|كفاية|بس/.test(lower)) {
        stopSpeaking();
        return;
      }

      // 7. Reading Paper / Document / Text
      if (/ورقة|اقرأ|نص|كتابة|مكتوب|خطاب|تقرير|فاتورة|روشتة|شيك|كتاب|رسالة/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص الورقة وقراءة المكتوب بدقة...`);
        handleAnalyze("read_text", true, cleanTranscript);
        return;
      }

      // 8. Currency Counting
      if (/فلوس|عملة|جنيه|ريال|دولار|نقود|عد|احسب|باقي|فكة|كام دول|كام جنيه/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص العملات وحساب المبلغ...`);
        handleAnalyze("currency", true, cleanTranscript);
        return;
      }

      // 9. Colors & Fashion
      if (/لون|ألوان|ملابس|قميص|بنطلون|فستان|طقم|بدلة|متناسق|لابس ايه/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص ألوان وتناسق الملابس...`);
        handleAnalyze("colors", true, cleanTranscript);
        return;
      }

      // 10. Find Object
      if (/دور|ابحث|فين|أين|مفاتيح|محفظة|نظارة|عصا|ريموت|تليفون|موبايل/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ البحث عن الشيء المفقود...`);
        handleAnalyze("find_object", true, cleanTranscript);
        return;
      }

      // 11. Appliance & Screens
      if (/شاشة|ميكروويف|غسالة|تكييف|سكر|ضغط|حرارة|درجة/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ قراءة الشاشة والأرقام...`);
        handleAnalyze("appliance", true, cleanTranscript);
        return;
      }

      // 12. Transit & Buses
      if (/أتوبيس|اتوبيس|ميكروباص|مواصلات|عربية|خط|محطة|رايح فين/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص لافتة المواصلات...`);
        handleAnalyze("transit", true, cleanTranscript);
        return;
      }

      // 13. Barcode & Products
      if (/باركود|كود|منتج|علبة|سعر|صلاحية/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص المنتج والباركود...`);
        handleAnalyze("barcode", true, cleanTranscript);
        return;
      }

      // 14. Save Face
      if (/احفظ|سجل شخص|تذكر|صورة شخص/.test(lower)) {
        triggerSaveFace();
        return;
      }

      // 15. Faces identification
      if (/مين|شخص|صاحبي|وجه|أمامي|من هذا|مين ده/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ التعرف على الشخص أمامك...`);
        handleAnalyze("faces", true, cleanTranscript);
        return;
      }

      // 16. Obstacles
      if (/عائق|طريق|قدامي|مسافة|سلم|حفرة|رصيف|خطر/.test(lower)) {
        speak(`سمعتك: "${cleanTranscript}". جارٍ فحص الطريق والعوائق...`);
        handleAnalyze("obstacle", true, cleanTranscript);
        return;
      }

      // 17. ANY OTHER NATURAL QUESTION (e.g. "ايه اللي قدامي ده", "العلبة دي ايه", "شايف ايه"):
      speak(`سمعتك: "${cleanTranscript}". جارٍ الفحص والإجابة...`);
      handleAnalyze("general", true, cleanTranscript);
    });
  };

  handleVoiceCommandRef.current = handleVoiceCommand;

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden select-none touch-none">
      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover opacity-90 filter brightness-105 contrast-110 pointer-events-none"
      />

      {/* OLED Battery Saver Blackout Screen */}
      {isBlackoutMode && (
        <div
          onClick={toggleBlackoutMode}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
          role="button"
          aria-label="وضع الشاشة المظلمة مفعل لتوفير البطارية. انقر في أي مكان للخروج"
        >
          <div className="w-14 h-14 rounded-full border border-gray-900 flex items-center justify-center mb-3">
            <Moon className="w-6 h-6 text-gray-800 animate-pulse" />
          </div>
          <p className="text-gray-600 text-xs font-bold">وضع التوفير المظلم يعمل 🔋</p>
          <p className="text-gray-800 text-[10px] mt-1">الكاميرا والمايك نشطان • المس الشاشة للخروج</p>
        </div>
      )}

      {/* Top Bar */}
      <header className="relative z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-lg text-white tracking-wide">نور دهب</span>

          {/* Offline Badge */}
          {!isOnline && (
            <span className="px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 animate-pulse">
              <WifiOff className="w-3 h-3" />
              أوفلاين
            </span>
          )}

          {/* Speaker Button */}
          <button
            onClick={handleUnlockSpeaker}
            className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
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
          {/* Voice Speed Toggle */}
          <button
            onClick={() => {
              cycleSpeechRate();
              const nextRate = speechRate === 1.0 ? "1.25" : speechRate === 1.25 ? "1.5" : speechRate === 1.5 ? "2" : "1";
              speak(`سرعة الصوت ${nextRate}`);
            }}
            className="px-2 py-1 bg-dark-800 text-gold-300 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95"
            title="سرعة نطق الصوت"
            aria-label={`سرعة الصوت ${speechRate} ضعف`}
          >
            <Gauge className="w-3 h-3 text-gold-400" />
            {speechRate}x
          </button>

          {/* OLED Blackout Mode (Battery Saver) */}
          <button
            onClick={() => {
              toggleBlackoutMode();
              speak(isBlackoutMode ? "تم إلغاء شاشة التوفير." : "تم تفعيل شاشة التوفير المظلمة. اضغط في أي مكان لإلغائها.");
            }}
            className={`p-1.5 rounded-xl border transition-all ${
              isBlackoutMode
                ? "bg-purple-900/50 text-purple-300 border-purple-500"
                : "bg-dark-800 text-gray-300 border-gray-700"
            }`}
            title="وضع الشاشة المظلمة لتوفير البطارية"
            aria-label="توفير البطارية"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Compass Heading Button */}
          {permState === "granted" && (
            <button
              onClick={announceCompassDirection}
              className="px-2 py-1 bg-dark-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 hover:border-cyan-400"
              title="البوصلة الصوتية والاتجاهات"
              aria-label={`البوصلة: متجه ${compass.directionAr}. اضغط لسماع الاتجاه`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px]">{compass.shortLabel}</span>
            </button>
          )}

          {/* Companion Co-Pilot Button */}
          {permState === "granted" && (
            <button
              onClick={toggleCompanionMode}
              className={`px-2 py-1 rounded-xl text-xs font-black flex items-center gap-1 border transition-all active:scale-95 ${
                companionMode
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse"
                  : "bg-dark-800 text-emerald-400 border-emerald-500/40"
              }`}
              title="رفيق الطريق والمرافقة المستمرة"
              aria-label="وضع رفيق الطريق"
            >
              <span>🚶‍♂️</span>
              <span className="text-[10px]">{companionMode ? "الرفيق ⚡" : "الرفيق"}</span>
            </button>
          )}

          {/* Repeat Button */}
          {permState === "granted" && (
            <button
              onClick={handleRepeatLast}
              className="p-1.5 bg-dark-800 text-gold-300 border border-gold-500/40 rounded-xl active:scale-95"
              title="إعادة آخر وصف"
              aria-label="إعادة الوصف"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Torch Button */}
          {permState === "granted" && (
            <button
              onClick={() => setTorch(!torchOn)}
              className={`p-1.5 rounded-xl border transition-all ${
                torchOn
                  ? "bg-amber-400 text-dark-900 border-amber-300 shadow-lg shadow-amber-400/50"
                  : "bg-dark-800 text-gray-300 border-gray-700"
              }`}
              title="الكشاف"
              aria-label="الكشاف"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Auto Scan Toggle */}
          <button
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
              autoScanEnabled
                ? "bg-blue-600 text-white border-blue-400 animate-pulse"
                : "bg-dark-800 text-gray-300 border-gray-700"
            }`}
          >
            <Zap className="w-3 h-3 text-gold-400" />
            {autoScanEnabled ? "مستمر ⚡" : "تلقائي"}
          </button>

          {/* SOS */}
          <button onClick={() => setIsSOSOpen(true)}
            className="px-2 py-1 bg-red-600 text-white font-black text-xs rounded-xl flex items-center gap-1 active:scale-95 shadow">
            <AlertTriangle className="w-3 h-3" />
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

      {/* CENTER: Permissions / Interactive Touch Area */}
      {permState !== "granted" ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center">
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
                <p className="text-xs text-gray-300">تشغيل الكاميرا ومكبر الصوت والتحدث فوراً.</p>
              </div>
              <button
                type="button"
                onClick={requestPermissions}
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-dark-900 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform animate-pulse cursor-pointer"
              >
                <ShieldCheck className="w-6 h-6" />
                تشغيل الكاميرا والاسبيكر
              </button>
            </div>
          )}

          {permState === "requesting" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-dark-800/90 rounded-3xl border border-gray-700">
              <RefreshCw className="w-16 h-16 text-gold-400 animate-spin" />
              <p className="text-white font-bold text-lg">جارٍ فتح الكاميرا...</p>
              <p className="text-gray-400 text-sm">اضغط "سماح" (Allow) في متصفحك إذا ظهرت</p>
            </div>
          )}

          {permState === "denied" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-red-950/90 rounded-3xl border-2 border-red-500/50 max-w-xs w-full">
              <Camera className="w-12 h-12 text-red-400" />
              <p className="text-white font-bold text-center text-sm">{cameraError || "يرجى منح إذن الكاميرا من إعدادات المتصفح"}</p>
              <button
                type="button"
                onClick={requestPermissions}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                حاول تشغيل الكاميرا مجدداً
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleCenterTap}
          aria-label="نقرة للوصف • ضغط مطول للتحدث • أزرار الصوت للتصوير • 4 نقرات للطوارئ"
          className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center cursor-pointer outline-none active:scale-98 transition-transform"
        >
          <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-2xl mb-3 ${
            analyzing ? "border-blue-400 bg-blue-500/30" : isListening ? "border-red-400 bg-red-500/30 animate-pulse" : "border-gold-400 bg-gold-500/30 gold-glow"
          }`}>
            {analyzing
              ? <RefreshCw className="w-12 h-12 text-blue-300 animate-spin" />
              : isListening
              ? <Mic className="w-12 h-12 text-red-400 animate-bounce" />
              : <Eye className="w-12 h-12 text-gold-400 animate-pulse" />
            }
          </div>

          <p className="text-lg font-black text-white max-w-sm leading-relaxed px-4 py-2 bg-black/85 rounded-2xl border border-gold-500/30 text-center shadow-lg">
            {analyzing ? "جارٍ التحليل السريع..." : isListening ? "أسمعك الآن، تفضل بالتحدث..." : currentResult}
          </p>

          <span className="mt-2 text-[11px] font-bold text-gold-300/90 bg-black/70 px-3 py-1 rounded-full border border-white/10">
            نقرة للوصف • ضغط مطول للتحدث • أزرار الصوت للتصوير
          </span>
        </div>
      )}

      {/* Bottom Action Grid & Shortcuts */}
      {permState === "granted" && (
        <footer className="relative z-20 px-3 pb-3 pt-1 bg-gradient-to-t from-black/95 via-black/85 to-transparent flex flex-col gap-1.5">
          {locationName && (
            <button
              onClick={announceCurrentLocation}
              aria-label={`موقعك الحالي: ${locationName}. اضغط لسماع اسم الشارع`}
              className="flex items-center gap-2 text-[11px] text-gray-300 bg-black/80 border border-gray-800 px-3 py-1 rounded-xl active:scale-98 text-right w-full hover:border-gold-500/40"
            >
              <Navigation className="w-3 h-3 text-gold-400 shrink-0 animate-pulse" />
              <span className="truncate flex-1">{locationName}</span>
              <span className="text-[9px] text-gold-400 shrink-0">اسمع 🔊</span>
            </button>
          )}

          {/* Quick Analysis Shortcut Pills */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { mode: "read_text" as const, icon: <FileText className="w-3.5 h-3.5 text-gold-400" />, label: "اقرأ" },
              { mode: "currency" as const, icon: <Banknote className="w-3.5 h-3.5 text-emerald-400" />, label: "فلوس" },
              { mode: "colors" as const, icon: <Shirt className="w-3.5 h-3.5 text-pink-400" />, label: "ملابس" },
              { mode: "find_object" as const, icon: <Search className="w-3.5 h-3.5 text-cyan-400" />, label: "مفقود" },
              { mode: "appliance" as const, icon: <Monitor className="w-3.5 h-3.5 text-yellow-400" />, label: "شاشات" },
              { mode: "transit" as const, icon: <Bus className="w-3.5 h-3.5 text-purple-400" />, label: "مواصلات" },
            ].map(btn => (
              <button
                key={btn.mode}
                onClick={() => handleAnalyze(btn.mode)}
                disabled={analyzing}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all active:scale-95 ${
                  activeMode === btn.mode
                    ? "bg-gold-500/20 border-gold-500 text-white font-bold"
                    : "bg-dark-800/80 border-gray-800 text-gray-300"
                }`}
              >
                {btn.icon}
                <span className="text-[9px] mt-0.5">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleAnalyze("barcode")}
              disabled={analyzing}
              className="flex items-center justify-center gap-1 p-2 bg-dark-800 border border-gray-700 rounded-xl active:scale-95 text-gray-300 font-bold text-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              باركود
            </button>

            <button
              onClick={triggerSaveFace}
              disabled={analyzing}
              className="flex items-center justify-center gap-1 p-2 bg-blue-900/40 border border-blue-500/50 rounded-xl active:scale-95 text-blue-300 font-bold text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              احفظ شخص
            </button>

            {/* Voice Input Button */}
            <button
              onClick={handleVoiceCommand}
              disabled={analyzing || isListening}
              className={`flex items-center justify-center gap-1 p-2 border rounded-xl font-black text-xs transition-all ${
                isListening
                  ? "bg-red-500 border-red-400 text-white animate-pulse shadow-lg scale-105"
                  : "bg-gold-500/25 border-gold-500 text-gold-300 active:scale-95"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {isListening ? "أسمعك..." : "تحدث 🎙️"}
            </button>

            <button
              onClick={stopSpeaking}
              className="flex items-center justify-center gap-1 p-2 bg-dark-800 border border-red-500/40 rounded-xl active:scale-95 text-white font-bold text-xs"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-gray-400" />}
              إسكات
            </button>
          </div>

          {/* Eng. Eslam Abu Dahab & Company link */}
          <div className="text-center pt-0.5">
            <a
              href="https://dahabsoftware.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-gold-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>فكرة وتطوير: المهندس إسلام أبو دهب</span>
              <span className="text-gold-400">• شركة دهب سوفتوير 🌐</span>
            </a>
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
