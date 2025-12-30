/* service-worker.js
   Simple app-shell + runtime cache.
   Works well for static deployments.
   Note: best used in production builds; in dev it can cause confusing caching.
*/

const VERSION = "reflexia-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Keep this list small: only true "shell" assets.
// Vite will serve / and /index.html; your JS/CSS hashed assets are discovered at runtime.
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // If some icons don't exist yet, don't fail install.
      return Promise.resolve();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );

      // Take control immediately
      await self.clients.claim();
    })()
  );
});

// Strategy:
// - Navigation (HTML): network-first (so you get updates), fallback to cache for offline.
// - Static assets (js/css/images/fonts): stale-while-revalidate.
// - API calls: network-only (don’t cache Gemini, etc).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Don’t cache API calls (adjust patterns if you add your own API)
  if (url.pathname.includes("/v1beta/") || url.pathname.includes("/generateContent")) {
    return;
  }

  // Navigation requests (App shell)
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Static asset types: js/css/images/fonts
  if (
    url.pathname.startsWith("/assets/") ||
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "image" ||
    req.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Default: try cache, then network
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    // fallback to cached index for offline SPA routing
    return cached || (await caches.match("/index.html")) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then((res) => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    cache.put(req, res.clone());
    return res;
  } catch (e) {
    return Response.error();
  }
}
