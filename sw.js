const CACHE = 'seelenimpuls-v32';

const FILES = [
  './audio/stillness-space.mp3',
  './audio/meditation-situation-1-de.mp3',
  './audio/meditation-situation-2-de.mp3',
  './audio/meditation-situation-3-de.mp3',
  './audio/meditation-situation-4-de.mp3',
  './audio/meditation-situation-5-de.mp3',
  './audio/meditation-situation-6-de.mp3',
  './audio/meditation-situation-7-de.mp3',
  './audio/meditation-situation-8-de.mp3',
  './audio/meditation-situation-9-de.mp3',
  './audio/meditation-situation-10-de.mp3',
  './audio/meditation-situation-11-de.mp3',
  './audio/meditation-situation-1-en.mp3',
  './audio/meditation-situation-2-en.mp3',
  './audio/meditation-situation-3-en.mp3',
  './audio/meditation-situation-4-en.mp3',
  './audio/meditation-situation-5-en.mp3',
  './audio/meditation-situation-6-en.mp3',
  './audio/meditation-situation-7-en.mp3',
  './audio/meditation-situation-8-en.mp3',
  './audio/meditation-situation-9-en.mp3',
  './audio/meditation-situation-10-en.mp3',
  './audio/meditation-situation-11-en.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
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
