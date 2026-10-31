// ProStudio Service Worker — офлайн-кэш сайта.
// Версия кэша меняйте при обновлении статики, чтобы клиенты получили новое.
const VERSION = "prostudio-v2";
const CORE = [
  "./",
  "index.html",
  "css/styles.css",
  "js/config.js",
  "js/app.js",
  "manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "img/works-coffee.png",
  "img/works-bot.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  // API, форма и всё стороннее — только сеть
  const url = new URL(req.url);
  if (url.pathname.endsWith("/api") || url.origin !== self.location.origin) return;

  // Страницы — сеть с fallback на кэш (офлайн всё равно откроется)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
    );
    return;
  }

  // Статика — сначала кэш, затем сеть + догружаем в кэш
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
