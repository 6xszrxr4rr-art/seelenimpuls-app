const CACHE = 'seelenimpuls-v46';

const FILES = [
  './audio/stillness-space.mp3',
  './audio/hintergrund-situation-1.mp3',
  './audio/hintergrund-situation-2.mp3',
  './audio/hintergrund-situation-3.mp3',
  './audio/hintergrund-situation-4.mp3',
  './audio/hintergrund-situation-5.mp3',
  './audio/hintergrund-situation-6.mp3',
  './audio/hintergrund-situation-7.mp3',
  './audio/hintergrund-situation-8.mp3',
  './audio/hintergrund-situation-9.mp3',
  './audio/hintergrund-situation-10.mp3',
  './audio/hintergrund-situation-11.mp3',
  './audio/situation-01-de-basis.v1.mp3',
  './audio/situation-01-de-premium.v1.mp3',
  './audio/situation-01-en-basis.v1.mp3',
  './audio/situation-01-en-premium.v1.mp3',
  './audio/situation-02-de-basis.v1.mp3',
  './audio/situation-02-de-premium.v1.mp3',
  './audio/situation-02-en-basis.v1.mp3',
  './audio/situation-02-en-premium.v1.mp3',
  './audio/situation-03-de-basis.v1.mp3',
  './audio/situation-03-de-premium.v1.mp3',
  './audio/situation-03-en-basis.v1.mp3',
  './audio/situation-03-en-premium.v1.mp3',
  './audio/situation-04-de-basis.v1.mp3',
  './audio/situation-04-de-premium.v1.mp3',
  './audio/situation-04-en-basis.v1.mp3',
  './audio/situation-04-en-premium.v1.mp3',
  './audio/situation-05-de-basis.v1.mp3',
  './audio/situation-05-de-premium.v1.mp3',
  './audio/situation-05-en-basis.v1.mp3',
  './audio/situation-05-en-premium.v1.mp3',
  './audio/situation-06-de-basis.v1.mp3',
  './audio/situation-06-de-premium.v1.mp3',
  './audio/situation-06-en-basis.v1.mp3',
  './audio/situation-06-en-premium.v1.mp3',
  './audio/situation-07-de-basis.v1.mp3',
  './audio/situation-07-de-premium.v1.mp3',
  './audio/situation-07-en-basis.v1.mp3',
  './audio/situation-07-en-premium.v1.mp3',
  './audio/situation-08-de-basis.v1.mp3',
  './audio/situation-08-de-premium.v1.mp3',
  './audio/situation-08-en-basis.v1.mp3',
  './audio/situation-08-en-premium.v1.mp3',
  './audio/situation-09-de-basis.v1.mp3',
  './audio/situation-09-de-premium.v1.mp3',
  './audio/situation-09-en-basis.v1.mp3',
  './audio/situation-09-en-premium.v1.mp3',
  './audio/situation-10-de-basis.v1.mp3',
  './audio/situation-10-de-premium.v1.mp3',
  './audio/situation-10-en-basis.v1.mp3',
  './audio/situation-10-en-premium.v1.mp3',
  './audio/situation-11-de-basis.v1.mp3',
  './audio/situation-11-de-premium.v1.mp3',
  './audio/situation-11-en-basis.v1.mp3',
  './audio/situation-11-en-premium.v1.mp3',
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
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(client => client.navigate(client.url)))
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
                    url.pathname.endsWith('.css')  ||
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
