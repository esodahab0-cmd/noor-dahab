"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play audio chime using Web Audio API (works on all mobile devices after 1 touch)
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

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      // Force load voices
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Unlock audio engine for mobile browsers
  const unlockSpeaker = useCallback(() => {
    try {
      playChime(587.33, 0.2);
      if (synthRef.current) {
        // Small silent utterance to warm up mobile speech engine
        const warmUp = new SpeechSynthesisUtterance("نور دهب");
        warmUp.lang = "ar-SA";
        warmUp.volume = 1.0;
        warmUp.rate = 1.0;
        synthRef.current.speak(warmUp);
      }
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, [playChime]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    try {
      // Resume if paused (Chrome mobile quirk)
      if (synth.paused) synth.resume();
      synth.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "ar-SA";
      utt.rate = 1.05;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const voices = synth.getVoices();
      const arabicVoice = voices.find(v => 
        v.lang.startsWith("ar") || 
        v.name.includes("Arabic") || 
        v.name.includes("Maged") || 
        v.name.includes("Tarek") ||
        v.name.includes("Laila")
      );
      if (arabicVoice) utt.voice = arabicVoice;

      utt.onstart = () => {
        setIsSpeaking(true);
      };
      utt.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utt.onerror = () => {
        setIsSpeaking(false);
      };

      // Slight delay for Android Chrome speech cancel bug
      setTimeout(() => {
        synth.speak(utt);
      }, 50);
    } catch (e) {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback((onResult: (t: string) => void) => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      speak("التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام متصفح جوجل كروم.");
      return;
    }
    try {
      stopSpeaking();
      playChime(880, 0.15); // Beep to indicate mic is listening
      const rec = new SR();
      rec.lang = "ar-SA";
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        if (t) onResult(t);
      };

      recRef.current = rec;
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [speak, stopSpeaking, playChime]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
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
    isAudioUnlocked,
    playChime
  };
}