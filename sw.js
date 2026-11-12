/* Offline support: after the first visit the browser keeps a copy of the game. */
var CACHE = 'mythos-v2';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});
/* Serve from the saved copy at once, and refresh it in the background when online. */
self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (r) {
            if (r && r.ok && new URL(e.request.url).origin === location.origin) {
                var copy = r.clone();
                caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
            }
            return r;
        }).catch(function () { return hit; });
        return hit || net;
    }));
});
