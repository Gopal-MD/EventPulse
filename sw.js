/**
 * SmartVenue — Service Worker
 * Enables offline access for core stadium shell and assets
 */

const CACHE_NAME = 'smartvenue-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/config.js',
  '/utils.js',
  '/gemini.js',
  '/sheets.js',
  '/firebase.js',
  '/pay.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      Logger.info('SW', 'Pre-caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
