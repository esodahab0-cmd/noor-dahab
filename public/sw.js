const CACHE_NAME = "noor-dahab-pwa-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// IMPORTANT: NEVER intercept cross-origin requests (especially Firebase / Firestore / Google APIs)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Completely ignore any request that is NOT from our own domain
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. Completely ignore API routes, Firebase, Firestore, WebSockets
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("firestore") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("firebase")
  ) {
    return;
  }

  // 3. Only handle GET requests for our static assets
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((res) => {
        if (res) return res;
        return caches.match("/");
      });
    })
  );
});