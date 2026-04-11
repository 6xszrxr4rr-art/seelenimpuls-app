const CACHE = 'seelenimpuls-v9';

const FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './situations/situation-1.js',
  './situations/situation-2.js',
  './situations/situation-3.js',
  './situations/situation-4.js',
  './situations/situation-5.js',
  './situations/situation-6.js',
  './situations/situation-7.js',
  './situations/situation-8.js',
  './situations/situation-9.js',
  './situations/situation-10.js',
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

// Installation: alles cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first, dann Netzwerk
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
