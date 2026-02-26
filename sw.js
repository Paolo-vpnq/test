const CACHE_NAME = 'm3-safety-observer-v9';
const DB_NAME = 'm3-safety-observer';
const STORE_NAME = 'observations';
const SETTINGS_STORE = 'settings';

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
        base + 'assets/nne-logo-white.png',
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

// ===== Background Sync (Android Chrome) ======================
// When the browser regains connectivity, this event fires even if
// the app tab is not open.

self.addEventListener('sync', event => {
  if (event.tag === 'sync-observations') {
    event.waitUntil(syncAllPending());
  }
});

// ===== IndexedDB helpers for SW context =======================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getSettingFromDB(db, key) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const request = tx.objectStore(SETTINGS_STORE).get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result.filter(o => o.status === 'pending'));
      request.onerror = (e) => reject(e.target.error);
    } catch (e) {
      resolve([]);
    }
  });
}

function deleteObservation(db, id) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    } catch (e) {
      resolve(); // Don't block sync on delete failure
    }
  });
}

// Core POST: try cors first, fall back to no-cors
async function postToEndpoint(url, payload) {
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    });
    return;
  } catch (e) {
    // CORS blocked — try no-cors
  }

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: payload,
  });
}

async function syncAllPending() {
  let db;
  try {
    db = await openDB();
  } catch (err) {
    // DB not available — rethrow so browser retries sync
    throw new Error('SW sync: IndexedDB not available');
  }

  // Get endpoint URL: postMessage value → IndexedDB → hardcoded fallback
  let endpointUrl = self._endpointUrl;
  if (!endpointUrl) {
    endpointUrl = await getSettingFromDB(db, 'powerAutomateUrl');
  }
  if (!endpointUrl) {
    // Last resort: use hardcoded test endpoint
    endpointUrl = 'https://webhook.site/6eebf958-ce28-4bcc-879a-ac81deddb63b';
  }

  const pending = await getAllPending(db);
  if (pending.length === 0) return;

  for (const obs of pending) {
    try {
      const payload = { ...obs };
      delete payload.status;

      await postToEndpoint(endpointUrl, JSON.stringify(payload));
      await deleteObservation(db, obs.id);
    } catch (err) {
      // Network still down — throw so browser retries later
      throw err;
    }
  }

  // Notify open tabs that sync completed
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', count: pending.length });
  });
}

// Listen for messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_ENDPOINT') {
    self._endpointUrl = event.data.url;
  }
});
