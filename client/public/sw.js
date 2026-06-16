// Service Worker para E-Saúde PWA
const CACHE_NAME = 'esaude-v1';
const RUNTIME_CACHE = 'esaude-runtime-v1';
const API_CACHE = 'esaude-api-v1';

// Assets que devem ser cacheados na instalação
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manus-storage/icon-192x192_7b1b28b7.png',
  '/manus-storage/icon-384x384_cda548a9.png',
  '/manus-storage/icon-512x512_30e9fb32.png',
  '/manus-storage/icon-256x256_ee12a514.png',
  '/manus-storage/apple-touch-icon_d856c7fe.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Service Worker: Some assets failed to cache', err);
        // Não falha a instalação se alguns assets não forem encontrados
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições para diferentes origens
  if (url.origin !== location.origin) {
    return;
  }

  // Requisições para API tRPC: Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta bem-sucedida
          if (response.ok) {
            const cache = caches.open(API_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              new Response(
                JSON.stringify({
                  error: 'Offline - dados em cache podem estar desatualizados',
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({ 'Content-Type': 'application/json' }),
                }
              )
            );
          });
        })
    );
    return;
  }

  // Requisições para assets: Cache first, network fallback
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((response) => {
            // Cache a resposta bem-sucedida
            if (response.ok) {
              const cache = caches.open(RUNTIME_CACHE);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Requisições HTML: Network first, cache fallback
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta bem-sucedida
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              caches.match('/').then((homeResponse) => {
                return (
                  homeResponse ||
                  new Response('Offline - página não disponível em cache', {
                    status: 503,
                    statusText: 'Service Unavailable',
                  })
                );
              })
            );
          });
        })
    );
    return;
  }

  // Requisições padrão: Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background Sync (opcional - para sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      fetch('/api/trpc/system.sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.log('Background sync failed:', err);
      })
    );
  }
});

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nova notificação de E-Saúde',
    icon: '/manus-storage/icon-192x192_7b1b28b7.png',
    badge: '/manus-storage/icon-192x192_7b1b28b7.png',
    tag: 'esaude-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'E-Saúde', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('Service Worker: Loaded and ready');
