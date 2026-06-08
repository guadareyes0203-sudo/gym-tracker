// Service Worker — Network First
// Version se actualiza con cada deploy
const CACHE_NAME = 'gym-tracker-v1';
const URLS_TO_CACHE = ['/gym-tracker/', '/gym-tracker/index.html'];

// Install — cachear recursos base
self.addEventListener('install', event => {
  self.skipWaiting(); // activar inmediatamente sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

// Activate — limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // tomar control inmediato
  );
});

// Fetch — NETWORK FIRST: siempre intenta la red, caché solo si falla
self.addEventListener('fetch', event => {
  // Solo interceptar requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }) // forzar red, sin caché del browser
      .then(response => {
        // Guardamos la versión nueva en caché
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, usar caché (modo offline)
        return caches.match(event.request);
      })
  );
});

// Mensaje desde la app para activar SW nuevo inmediatamente
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
