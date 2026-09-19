/**
 * نور دهب — محرك التحديث التلقائي للكفيف
 * Auto-Update Watcher with Arabic Voice Announcement
 *
 * عند وجود نسخة جديدة من التطبيق:
 * 1. ينبّه المستخدم صوتياً بالعربية
 * 2. يطبّق التحديث تلقائياً
 * 3. يُعيد تحميل الصفحة بعد الإعلان
 */

let updateAnnounced = false;

export function initAutoUpdateWatcher(speakFn: (text: string) => void): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // مستمع: عند انتقال السيطرة لـ Service Worker جديد → أعِد التحميل
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updateAnnounced) {
      // أعطِ وقتاً للإعلان الصوتي قبل إعادة التحميل
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  });

  // مستمع: عند اكتشاف Service Worker جديد
  navigator.serviceWorker.ready
    .then((registration) => {
      // فحص دوري كل 60 ثانية للتحديثات
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60_000);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // هناك تحديث جديد جاهز!
            if (!updateAnnounced) {
              updateAnnounced = true;

              // إعلان صوتي للكفيف
              speakFn(
                "يوجد تحديث جديد لتطبيق نور دهب! جاري تطبيق التحديث الآن... يرجى الانتظار."
              );

              // أرسل skipWaiting للـ Service Worker الجديد
              setTimeout(() => {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }, 1500);
            }
          }
        });
      });
    })
    .catch(() => {
      // Service Worker غير مسجل أو خطأ — تجاهل
    });
}
