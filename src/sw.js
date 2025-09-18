// Service Worker para notificações push - Pedro Tiago Contabilidade
const CACHE_NAME = 'pedro-tiago-contabilidade-v1.2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Manipular notificações push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova mensagem da Pedro Tiago Contabilidade!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver mensagem',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pedro Tiago Contabilidade', options)
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://www.pedrotiagocontabilidade.com.br')
    );
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(
      clients.openWindow('https://www.pedrotiagocontabilidade.com.br')
    );
  }
});

// Notificações automáticas para leads
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NEW_LEAD') {
    const options = {
      body: `Novo lead: ${event.data.name} - ${event.data.email}`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: {
        type: 'lead',
        leadData: event.data
      }
    };

    self.registration.showNotification('📧 Novo Lead Recebido!', options);
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return fetch('/api/sync')
    .then((response) => response.json())
    .then((data) => {
      if (data.hasNewMessages) {
        return self.registration.showNotification('Pedro Tiago Contabilidade', {
          body: 'Você tem novas mensagens!',
          icon: '/favicon.svg'
        });
      }
    })
    .catch((error) => {
      console.log('Sync failed:', error);
    });
}