"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useSingleSession() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("noor_user");
    const localToken = localStorage.getItem("noor_session_token");
    if (!storedUser || !localToken) return;
    const userData = JSON.parse(storedUser);
    try {
      const userRef = doc(db, "users", userData.username);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const remote = snap.data();
          if (remote.activeSessionToken && remote.activeSessionToken !== localToken) {
            localStorage.removeItem("noor_session_token");
            localStorage.removeItem("noor_user");
            alert("تم تسجيل الدخول بحسابك من جهاز آخر. تم قفل جلستك الحالية.");
            router.push("/login?kicked=true");
          }
        }
      });
      return () => unsub();
    } catch (e) { console.warn("Session watcher:", e); }
  }, [router]);
}
