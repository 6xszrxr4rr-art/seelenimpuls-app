const CACHE = 'seelenimpuls-v49';

// Only small shell files are precached during install.
// Audio and JS/CSS files are cached lazily on first request (see fetch handler).
const SHELL = [
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
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
    // App shell: network first, cache as fallback
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
    // Assets (audio, icons): cache first, fetch and cache on miss
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        }))
    );
  }
});
