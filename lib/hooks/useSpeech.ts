"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play audio chime using Web Audio API
  const playChime = useCallback((freq = 587.33, duration = 0.15) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + duration);
      }
    } catch (e) {}
  }, []);

  // Instant silent audio unlocking for autoplay policy
  const prepareAudioEngine = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (typeof window !== "undefined") {
        // Pre-warm audio element with silent buffer
        const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          silentAudio.pause();
        }).catch(() => {});
      }
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  // Unlock audio engine for mobile browsers
  const unlockSpeaker = useCallback(() => {
    prepareAudioEngine();
    playChime(587.33, 0.2);
  }, [prepareAudioEngine, playChime]);

  // Stop any active speech (audio or synth)
  const stopSpeaking = useCallback(() => {
    try {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setIsSpeaking(false);
  }, []);

  // High-Quality Arabic Voice via Audio Stream with WebSpeech Fallback
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!text || !text.trim()) return;
    stopSpeaking();
    prepareAudioEngine();

    // 1. Try High-Quality Realistic Arabic Audio Stream via /api/ai/tts
    try {
      const cleanText = text.trim();
      const audioUrl = `/api/ai/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        activeAudioRef.current = null;
        onEnd?.();
      };
      audio.onerror = () => {
        fallbackToSynth(cleanText, onEnd);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          fallbackToSynth(cleanText, onEnd);
        });
      }
    } catch (err) {
      fallbackToSynth(text, onEnd);
    }
  }, [stopSpeaking, prepareAudioEngine]);

  const fallbackToSynth = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }
    try {
      const synth = window.speechSynthesis;
      if (synth.paused) synth.resume();
      synth.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "ar-EG";
      utt.rate = 1.0;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const voices = synth.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
      if (arabicVoice) utt.voice = arabicVoice;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utt.onerror = () => setIsSpeaking(false);

      synth.speak(utt);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const shouldKeepListeningRef = useRef(false);
  const onResultCallbackRef = useRef<((t: string) => void) | null>(null);

  const startListening = useCallback((onResult: (t: string) => void) => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      speak("التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام متصفح جوجل كروم.");
      return;
    }

    shouldKeepListeningRef.current = true;
    onResultCallbackRef.current = onResult;

    const initRecognizer = () => {
      if (!shouldKeepListeningRef.current) return;
      try {
        if (recRef.current) {
          try { recRef.current.abort(); } catch {}
          recRef.current = null;
        }
        const rec = new SR();
        rec.lang = "ar-EG";
        rec.continuous = false;
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
          // Auto-restart if user still in listening mode and not aborted
          if (shouldKeepListeningRef.current) {
            setTimeout(() => {
              if (shouldKeepListeningRef.current) {
                initRecognizer();
              }
            }, 300);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            speak("يرجى تفعيل إذن الميكروفون من إعدادات المتصفح للتمكن من التحدث.");
            return;
          }
          if (e.error === "network") {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            speak("تعذر الاتصال بخدمة الصوت. يرجى التحقق من اتصال الإنترنت.");
            return;
          }
          if (e.error !== "no-speech") {
            setIsListening(false);
          }
        };

        rec.onresult = (e: any) => {
          const t = e.results[0]?.[0]?.transcript;
          if (t && t.trim()) {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            try { rec.stop(); } catch {}
            onResultCallbackRef.current?.(t.trim());
          }
        };

        recRef.current = rec;
        try {
          rec.start();
        } catch (startErr) {
          console.warn("Recognizer start failed, retrying:", startErr);
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              try { rec.start(); } catch {}
            }
          }, 200);
        }
      } catch (e) {
        setIsListening(false);
      }
    };

    stopSpeaking();
    prepareAudioEngine();
    playChime(880, 0.12);
    setTimeout(initRecognizer, 150);
  }, [speak, stopSpeaking, prepareAudioEngine, playChime]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    unlockSpeaker,
    prepareAudioEngine,
    isAudioUnlocked,
    playChime
  };
}