"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface A11yContextType {
  announce: (message: string) => void;
  batterySaverMode: boolean;
  toggleBatterySaver: () => void;
  describeUI: () => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within GlobalA11yProvider");
  }
  return context;
}

interface GlobalA11yProviderProps {
  children: ReactNode;
}

export function GlobalA11yProvider({ children }: GlobalA11yProviderProps) {
  const router = useRouter();
  const [batterySaverMode, setBatterySaverMode] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  // ── ARIA Live Region Announcer ───────────────────────────────────
  const announce = (message: string) => {
    setLiveMessage("");
    setTimeout(() => {
      setLiveMessage(message);
    }, 50);
  };

  // ── Battery Saver Mode ───────────────────────────────────────────
  const toggleBatterySaver = () => {
    setBatterySaverMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.style.filter = "grayscale(100%) contrast(1.2)";
        announce("تم تفعيل وضع توفير البطارية. تباين عالي مع تدرج رمادي.");
      } else {
        document.body.style.filter = "";
        announce("تم إيقاف وضع توفير البطارية.");
      }
      return next;
    });
  };

  // ── Full UI Description ───────────────────────────────────────────
  const describeUI = () => {
    const currentPath = window.location.pathname;
    let description = "";

    if (currentPath === "/") {
      description = "الصفحة الرئيسية: زر الكاميرا في المنتصف للوصف الفوري. زر الطوارئ أحمر كبير أسفل الشاشة. أدوات مساعدة في الأعلى: سرعة الصوت، وصف الصفحة، وتوفير البطارية.";
    } else if (currentPath.startsWith("/login")) {
      description = "صفحة تسجيل الدخول: حقل اسم المستخدم، حقل كلمة المرور، وزر تسجيل الدخول.";
    } else if (currentPath.startsWith("/admin")) {
      description = "لوحة التحكم: قائمة المستخدمين وإحصائيات النظام.";
    } else {
      description = "صفحة عامة في تطبيق نور دهب.";
    }

    announce(description);
  };

  // ── Global Keyboard Shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // SOS Emergency: S or س
      if (e.key === "s" || e.key === "S" || e.key === "س") {
        announce("تم تفعيل وضع الطوارئ.");
        window.dispatchEvent(new CustomEvent("sos-triggered"));
      }

      // Alt + D: Describe UI (Alt + ي for Arabic)
      if (e.altKey && (e.key === "d" || e.key === "D" || e.key === "ي")) {
        e.preventDefault();
        describeUI();
      }

      // Alt + H: Home (Alt + ا for Arabic)
      if (e.altKey && (e.key === "h" || e.key === "H" || e.key === "ا")) {
        e.preventDefault();
        router.push("/");
        announce("الانتقال إلى الصفحة الرئيسية.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <A11yContext.Provider
      value={{
        announce,
        batterySaverMode,
        toggleBatterySaver,
        describeUI,
      }}
    >
      {children}
      
      {/* ARIA Live Region - Invisible but readable by screen readers */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {liveMessage}
      </div>
    </A11yContext.Provider>
  );
}
