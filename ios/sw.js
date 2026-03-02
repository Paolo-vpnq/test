const CACHE_NAME = 'm3-safety-observer-ios-v3';
const DB_NAME = 'm3-safety-observer';
const STORE_NAME = 'observations';
const SETTINGS_STORE = 'settings';
const PENDING_NOTIFICATION_TAG = 'pending-observations';

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
// the app tab is not open. We ALWAYS try to sync here — the app's
// foreground sync uses isSyncing lock to avoid collisions.

self.addEventListener('sync', event => {
  if (event.tag === 'sync-observations') {
    event.waitUntil(syncAllPending());
  }
});

// ===== Periodic Background Sync ==============================
// Wakes the SW periodically even when the app is closed.
// The app registers this with a minInterval; the browser controls actual timing.

self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync-observations') {
    event.waitUntil(syncAllPending());
  }
});

// ===== Notification Click ====================================
// When user taps the notification, open/focus the app

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(self.registration.scope);
    }).then(() => {
      // Re-show notification after a delay if still offline with pending items
      return new Promise(resolve => setTimeout(resolve, 3000));
    }).then(async () => {
      try {
        const db = await openDB();
        const pending = await getAllPending(db);
        if (pending.length > 0) {
          await showPendingNotif(pending.length);
        }
      } catch (e) {}
    })
  );
});

// ===== IndexedDB helpers for SW context =======================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
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

// Claim an observation (mark as 'sending') so no other process sends it.
function claimObservation(db, id) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const obs = getReq.result;
        if (!obs || obs.status !== 'pending') {
          resolve(false);
          return;
        }
        obs.status = 'sending';
        store.put(obs);
        tx.oncomplete = () => resolve(true);
      };
      getReq.onerror = () => resolve(false);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// Reset a 'sending' observation back to 'pending' on failure.
function unclaimObservation(db, id) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const obs = getReq.result;
        if (obs && obs.status === 'sending') {
          obs.status = 'pending';
          store.put(obs);
        }
        tx.oncomplete = () => resolve();
      };
      getReq.onerror = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// Core POST: no-cors only to avoid double-send from CORS-then-fallback.
async function postToEndpoint(url, payload) {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: payload,
  });
}

// Save text-only copy to history store (never blocks sync)
function addToHistorySW(db, observation) {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains('history')) {
        resolve();
        return;
      }
      const tx = db.transaction('history', 'readwrite');
      const entry = {
        id: observation.id,
        datetime_created: observation.datetime_created || observation.timestamp,
        building: observation.building,
        level: observation.level,
        safetyCategory: observation.safetyCategory || '',
        description: observation.description,
        mainContractor: observation.mainContractor || '',
      };
      tx.objectStore('history').put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// ===== Notification Helpers ==================================

async function showPendingNotif(count) {
  try {
    await self.registration.showNotification('NNE Safety Observer', {
      body: count + ' observation(s) pending — will upload when online',
      icon: self.registration.scope + 'assets/icons/icon-192.png',
      badge: self.registration.scope + 'assets/icons/icon-192.png',
      tag: PENDING_NOTIFICATION_TAG,
      renotify: false,
      requireInteraction: true, // Keeps notification visible (and Chrome alive)
    });
  } catch (e) {}
}


async function showSyncSuccessNotif(count) {
  try {
    // Close the pending notification first
    const notifications = await self.registration.getNotifications({ tag: PENDING_NOTIFICATION_TAG });
    notifications.forEach(n => n.close());

    await self.registration.showNotification('NNE Safety Observer', {
      body: count + ' observation(s) uploaded successfully',
      icon: self.registration.scope + 'assets/icons/icon-192.png',
      badge: self.registration.scope + 'assets/icons/icon-192.png',
      tag: 'sync-success',
      renotify: true,
      requireInteraction: false,
    });
  } catch (e) {}
  try { navigator.clearAppBadge(); } catch (e) {}
}

async function clearPendingNotif() {
  try {
    const notifications = await self.registration.getNotifications({ tag: PENDING_NOTIFICATION_TAG });
    notifications.forEach(n => n.close());
  } catch (e) {}
  try { navigator.clearAppBadge(); } catch (e) {}
}

// ===== Core Sync Logic =======================================

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
    endpointUrl = 'https://webhook.site/872b4482-e4d0-4e89-b71a-d9bf48112c81';
  }

  const pending = await getAllPending(db);
  if (pending.length === 0) {
    // No pending items — clear any stale notification
    await clearPendingNotif();
    return;
  }

  let syncedCount = 0;

  for (const obs of pending) {
    // Claim this observation so no other process (app foreground, timer) sends it
    const claimed = await claimObservation(db, obs.id);
    if (!claimed) continue; // Already being sent by another process

    try {
      const payload = { ...obs };
      delete payload.status;
      payload.datetime_sent = new Date().toISOString();

      await postToEndpoint(endpointUrl, JSON.stringify(payload));
      await addToHistorySW(db, obs);
      await deleteObservation(db, obs.id);
      syncedCount++;
    } catch (err) {
      // Network still down — unclaim so it can be retried
      await unclaimObservation(db, obs.id);
      await showPendingNotif(pending.length - syncedCount);
      throw err;
    }
  }

  // All synced successfully
  if (syncedCount > 0) {
    // Show success notification (replaces the pending one)
    await showSyncSuccessNotif(syncedCount);
  }

  // Notify open tabs that sync completed
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', count: syncedCount });
  });
}

// Listen for messages from the main app
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SET_ENDPOINT') {
    self._endpointUrl = event.data.url;
  }

  if (event.data.type === 'SHOW_PENDING_NOTIFICATION') {
    // Show notification once as a reminder to reopen the app.
    // No polling — iOS kills the SW when the app closes anyway.
    // In-app sync (15s timer + visibility change + online event) handles sync.
    event.waitUntil(showPendingNotif(event.data.count));
  }

  if (event.data.type === 'CLEAR_PENDING_NOTIFICATION') {
    clearPendingNotif();
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
