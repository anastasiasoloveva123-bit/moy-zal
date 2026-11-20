const CACHE = 'moy-zal-offline-v2';
const ASSETS = ['./', './index.html', './app.js', './style.css', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const match = await cache.match(event.request, { ignoreSearch: true });
    if (match) return match;
    try { return await fetch(event.request); }
    catch { return (event.request.mode === 'navigate') ? await cache.match('./index.html') : Response.error(); }
  })());
});
