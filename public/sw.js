const CACHE = 'mpb-shell-v1';
const SHELL = [
  '/',
  '/charts',
  '/alerts',
  '/settings',
  '/settings/currency',
  '/entries/new',
  '/goals/new',
  '/manifest.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Skip non-same-origin and Next.js internals
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/_next/')) return;

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
