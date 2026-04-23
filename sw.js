const CACHE = 'seelenimpuls-v25';

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

self.addEventListener('install', event => {
  // Nur cachen — KEIN skipWaiting(), damit der Nutzer
  // den Reload-Banner bestätigen kann
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Seite sendet SKIP_WAITING wenn Nutzer auf „Jetzt laden" klickt
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isAppFile = url.pathname.endsWith('.html') ||
                    url.pathname.endsWith('.js')   ||
                    url.pathname === '/'            ||
                    url.pathname === '';

  if (isAppFile) {
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
