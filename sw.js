// ============================================================
// SERVICE WORKER - Barbershop PWA
// ============================================================
const CACHE_NAME = 'barbershop-v1.0.0';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache file dasar
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(CACHE_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.warn('[SW] Gagal cache:', err);
      })
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            console.log('[SW] Hapus cache lama:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: strategi network-first untuk API, cache-first untuk assets
self.addEventListener('fetch', function(event) {
  const url = event.request.url;

  // Skip request ke Google Apps Script (API) — selalu fresh
  if (url.includes('script.google.com') || url.includes('googleusercontent.com')) {
    return; // biarkan fetch normal
  }

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Update cache dengan response baru
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Kalau offline, ambil dari cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});

// Handle pesan dari client
self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});