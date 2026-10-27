// Caches the app shell and data so it still opens with no signal on the festival grounds.
// Bump CACHE when shipping changes so phones drop the old copy.
const CACHE = "edc-shell-v23";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "motion.js", "config.js", "vendor/supabase.js", "manifest.json",
  "icon-180.png", "icon-192.png", "icon-512.png", "logo.svg", "stage.svg", "favicon-32.png",
  "data/lineup.json", "data/set-times-estimated.json", "data/afterparties.json", "data/stages-and-map.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Refetch past the browser HTTP cache. A navigation Request can't take fetch options, so use its URL.
const refetch = req => fetch(req.mode === "navigate" ? req.url : req, { cache: "no-cache" });

// Data files (set times, lineup) change during the festival week: try the network first, but give up
// after 3 seconds and use the cached copy, since festival signal is slow more often than it's absent.
function networkFirst(req) {
  const net = refetch(req).then(res => {
    if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const timeout = new Promise(r => setTimeout(r, 3000));
  return Promise.race([net, timeout.then(() => caches.match(req))])
    .then(res => res || net)
    .catch(() => caches.match(req));
}

// Everything else: serve the cached copy right away and refresh it in the background.
function staleWhileRevalidate(req) {
  return caches.match(req).then(cached => {
    const net = refetch(req).then(res => {
      if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  });
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // fonts, PostHog and Supabase go straight to the network
  if (url.pathname.includes("/data/") || e.request.mode === "navigate") e.respondWith(networkFirst(e.request));
  else e.respondWith(staleWhileRevalidate(e.request));
});
