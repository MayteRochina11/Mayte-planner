const CACHE_NAME = 'mayte-planner-v3';
const urlsToCache = [
  '/Mayte-planner/',
  '/Mayte-planner/index.html',
  '/Mayte-planner/style.css',
  '/Mayte-planner/script.js',
  '/Mayte-planner/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});