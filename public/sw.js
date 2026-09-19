// ==========================================
// نور دهب — Service Worker v2 (Auto-Update)
// ==========================================

const CACHE_VERSION = "noor-dahab-v" + Date.now();

self.addEventListener("install", (e) => {
  // تثبيت فوري بدون انتظار إغلاق الجلسات القديمة
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // السيطرة الفورية على كل التبويبات
  );
});

// استقبال رسائل من الصفحة (skipWaiting)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Network First: دائماً جلب أحدث نسخة من Vercel
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // حفظ نسخة في الكاش للاستخدام بدون إنترنت
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});