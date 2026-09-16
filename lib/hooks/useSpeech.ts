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

  // Unlock audio engine for mobile browsers
  const unlockSpeaker = useCallback(() => {
    try {
      playChime(587.33, 0.2);
      if (typeof window !== "undefined") {
        const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        silentAudio.play().catch(() => {});
      }
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, [playChime]);

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
        // Fallback to Web Speech Synthesis if audio stream fails
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
  }, [stopSpeaking]);

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

  const startListening = useCallback((onResult: (t: string) => void) => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      speak("التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام متصفح جوجل كروم.");
      return;
    }
    try {
      stopSpeaking();
      playChime(880, 0.15);
      const rec = new SR();
      rec.lang = "ar-EG";
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