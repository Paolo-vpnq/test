const CACHE_NAME = 'm3-safety-observer-v3';

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use relative URLs — works regardless of subdirectory
      const base = self.registration.scope;
      return cache.addAll([
        base,
        base + 'index.html',
        base + 'css/style.css',
        base + 'js/app.js',
        base + 'manifest.json',
        base + 'assets/icons/icon-192.png',
        base + 'assets/icons/icon-512.png',
      ]);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for GET, passthrough for POST
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match(self.registration.scope + 'index.html');
      }
    })
  );
});
