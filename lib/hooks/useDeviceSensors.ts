"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { calculateCompassDirection, CompassHeading } from "@/lib/utils/compass";

interface UseDeviceSensorsOptions {
  onShake?: () => void;
  onNetworkChange?: (isOnline: boolean) => void;
}

export function useDeviceSensors(options?: UseDeviceSensorsOptions) {
  const [isOnline, setIsOnline] = useState(true);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isBlackoutMode, setIsBlackoutMode] = useState(false);

  const wakeLockRef = useRef<any>(null);
  const lastShakeTimeRef = useRef<number>(0);

  // 1. Keep Screen Awake (Wake Lock API)
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      if (!wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        setIsWakeLockActive(true);
        wakeLockRef.current.addEventListener("release", () => {
          setIsWakeLockActive(false);
          wakeLockRef.current = null;
        });
      }
    } catch (e) {
      console.warn("Wake Lock request failed:", e);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  // Auto re-acquire wake lock if page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock]);

  // 2. Online / Offline Listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      options?.onNetworkChange?.(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      options?.onNetworkChange?.(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [options]);

  // 3. Shake Detection (DeviceMotionEvent)
  useEffect(() => {
    if (typeof window === "undefined" || !window.DeviceMotionEvent) return;

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      if (lastX === null || lastY === null || lastZ === null) {
        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
        return;
      }

      const deltaX = Math.abs(current.x - lastX);
      const deltaY = Math.abs(current.y - lastY);
      const deltaZ = Math.abs(current.z - lastZ);

      lastX = current.x;
      lastY = current.y;
      lastZ = current.z;

      // Shake threshold
      const speed = deltaX + deltaY + deltaZ;
      if (speed > 24) {
        const now = Date.now();
        if (now - lastShakeTimeRef.current > 1800) {
          lastShakeTimeRef.current = now;
          options?.onShake?.();
        }
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [options]);

  // 4. Compass Orientation Tracking
  const [compass, setCompass] = useState<CompassHeading>({
    degrees: 0,
    directionAr: "الشمال",
    shortLabel: "شمال"
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      if ("webkitCompassHeading" in e && typeof (e as any).webkitCompassHeading === "number") {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        const info = calculateCompassDirection(heading);
        setCompass(info);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  // Toggle OLED blackout battery saver
  const toggleBlackoutMode = useCallback(() => {
    setIsBlackoutMode((prev) => !prev);
  }, []);

  return {
    isOnline,
    isWakeLockActive,
    requestWakeLock,
    releaseWakeLock,
    isBlackoutMode,
    setIsBlackoutMode,
    toggleBlackoutMode,
    compass
  };
}
