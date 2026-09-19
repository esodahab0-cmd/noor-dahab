"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export interface InstantSpeechController {
  speak: (text: string, onEnd?: () => void) => void;
  streamTextChunk: (chunk: string) => void;
  finishStreaming: () => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * محرك النطق الفوري المحلي فائق السرعة
 * - يعتمد 100% على Web Speech API المحلي في المتصفح لزمن استجابة 0ms.
 * - يدعم التجميع والتدفق اللفظي (Chunked Streaming Speech) لنطق الجمل
 *   بمجرد وصول أول كلمات من الـ Streaming API دون انتظار الرد الكامل.
 * - إلغاء فوري وقاطع (Instant Interruption) عند مقاطعة الكفيف أو التقاط أمر جديد.
 */
export function useInstantSpeech(): InstantSpeechController {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const streamBufferRef = useRef("");

  // إعداد الأصوات وتحديد أفضل صوت عربي مصري / عربي فصيح
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    synthRef.current = window.speechSynthesis;

    const setupVoice = () => {
      if (!synthRef.current) return;
      const voices = synthRef.current.getVoices();
      
      // الترتيب حسب الأفضلية: مصري -> سعودي -> أي صوت عربي -> الافتراضي
      const bestArabicVoice =
        voices.find((v) => v.lang.startsWith("ar-EG")) ||
        voices.find((v) => v.lang.startsWith("ar-SA")) ||
        voices.find((v) => v.lang.startsWith("ar")) ||
        null;

      selectedVoiceRef.current = bestArabicVoice;
    };

    setupVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setupVoice;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // إيقاف فوري لأي نطق حالي وتفريغ طابور الانتظار
  const stopSpeaking = useCallback(() => {
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    streamBufferRef.current = "";

    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  // معالجة طابور الجمل تباعاً وبسلاسة
  const processNextInQueue = useCallback(() => {
    if (!synthRef.current || speechQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    const nextPhrase = speechQueueRef.current.shift();
    if (!nextPhrase || !nextPhrase.trim()) {
      processNextInQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextPhrase.trim());
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.lang = selectedVoiceRef.current?.lang || "ar-SA";
    utterance.rate = 1.05; // سرعة نطق مريحة ودقيقة
    utterance.pitch = 1.0;

    utterance.onend = () => {
      processNextInQueue();
    };

    utterance.onerror = () => {
      processNextInQueue();
    };

    try {
      synthRef.current.speak(utterance);
    } catch {
      processNextInQueue();
    }
  }, []);

  // نطق نص كامل (أو جملة مباشرة) مع إيقاف ما قبله فوراً
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      stopSpeaking();
      if (!text || !text.trim() || !synthRef.current) return;

      const utterance = new SpeechSynthesisUtterance(text.trim());
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.lang = selectedVoiceRef.current?.lang || "ar-SA";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      try {
        synthRef.current.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [stopSpeaking]
  );

  // استقبال جزء تدفقي (Streaming Chunk) وتقطيعه إلى جمل منطقية فوراً
  const streamTextChunk = useCallback(
    (chunk: string) => {
      streamBufferRef.current += chunk;

      // علامات انتهاء الجمل أو العبارات اللفظية (نقطة، فاصلة، علامة استفهام، سطر جديد)
      const punctuationRegex = /([.،؟!:\n])/;
      const parts = streamBufferRef.current.split(punctuationRegex);

      // إذا توافرت جملة مكتملة أو أكثر
      if (parts.length > 2) {
        // نجمع الجزء المكتمل مع علامة الترقيم التابعة له
        let completeSentence = "";
        for (let i = 0; i < parts.length - 1; i += 2) {
          completeSentence += parts[i] + (parts[i + 1] || "");
        }

        // الجزء المتبقي غير المكتمل نحتفظ به في الـ buffer
        streamBufferRef.current = parts[parts.length - 1] || "";

        if (completeSentence.trim()) {
          speechQueueRef.current.push(completeSentence.trim());
          if (!isProcessingQueueRef.current) {
            processNextInQueue();
          }
        }
      }
    },
    [processNextInQueue]
  );

  // إشعار اكتمال التدفق لنطق ما تبقى في الـ buffer
  const finishStreaming = useCallback(() => {
    if (streamBufferRef.current.trim()) {
      speechQueueRef.current.push(streamBufferRef.current.trim());
      streamBufferRef.current = "";
      if (!isProcessingQueueRef.current) {
        processNextInQueue();
      }
    }
  }, [processNextInQueue]);

  return {
    speak,
    streamTextChunk,
    finishStreaming,
    stopSpeaking,
    isSpeaking,
    isSupported,
  };
}
