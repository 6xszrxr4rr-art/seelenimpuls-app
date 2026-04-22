const CACHE = 'seelenimpuls-v24';

const FILES = [
  './audio/stillness-space.mp3',
  './audio/Song-Situation-1.mp3',
  './audio/Song-Situation-2.mp3',
  './audio/Song-Situation-3.mp3',
  './audio/Song-Situation-4.mp3',
  './audio/Song-Situation-5.mp3',
  './audio/Song-Situation-6.mp3',
  './audio/Song-Situation-7.mp3',
  './audio/Song-Situation-8.mp3',
  './audio/Song-Situation-9.mp3',
  './audio/Song-Situation-10.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Nur Audio & Icons precachen — HTML/JS immer frisch vom Netz
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Alten Cache löschen, dann alle Fenster übernehmen & zum Reload auffordern
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' })))
  );
});

// Fetch-Strategie:
//   HTML + JS → immer Netz-zuerst (frische Version), Cache als Fallback
//   Audio, Icons → Cache-zuerst (Offline-Support)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isAppFile = url.pathname.endsWith('.html') ||
                    url.pathname.endsWith('.js')   ||
                    url.pathname === '/'            ||
                    url.pathname === '';

  if (isAppFile) {
    // Netz-zuerst: holt immer die neueste Version
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-zuerst: Audio/Icons offline verfügbar
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        }))
    );
  }
});
