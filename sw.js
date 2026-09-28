// Service worker: makes the app work offline.
//
// Strategy: stale-while-revalidate. Every request is answered from the cache
// immediately (fast, works with no signal), and fetched in the background to
// refresh the cache. So after a deploy, the next open shows the old version
// and the one after that shows the new one — no version bump needed.

const CACHE = "home-gym-v1";

// Everything the app needs to start offline. tests/offline.test.js fails if a
// file is missing here, so new files can't silently break offline use.
const PRECACHE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.json",
  "src/app.js",
  "src/config.js",
  "src/cues.js",
  "src/format.js",
  "src/generator.js",
  "src/storage.js",
  "src/timer.js",
  "src/data/exercises.js",
  "src/data/wods.js",
  "fonts/barlow-400.woff2",
  "fonts/barlow-500.woff2",
  "fonts/barlow-600.woff2",
  "fonts/barlow-condensed-600.woff2",
  "fonts/barlow-condensed-700.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Drop caches from older versions of this file.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Page loads may carry a query string; they're all the same page.
    const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    const refresh = fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => undefined);

    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }
    return (await refresh) ?? Response.error();
  })());
});
