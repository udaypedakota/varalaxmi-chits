// Service Worker for Sri Varalaxmi Chits Web Push Notifications
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'శ్రీ వరలక్ష్మి చిట్స్', body: event.data.text() };
    }
  }

  const title = data.title || 'శ్రీ వరలక్ష్మి చిట్స్ అలర్ట్';
  const origin = self.location.origin;
  const iconUrl = `${origin}/chit-app-icon-192.png`;

  const options = {
    body: data.body || 'మీ చిట్ ఫండ్ నుండి ముఖ్యమైన అప్‌డేట్',
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || 'chit-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url ? (data.url.startsWith('http') ? data.url : `${origin}${data.url}`) : origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(err => {
      console.error('[SW showNotification error]', err);
      return self.registration.showNotification(title, {
        body: options.body,
        tag: options.tag
      });
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// PWA Offline / Fetch Interceptor (Required for Chrome Installability)
self.addEventListener('fetch', event => {
  // Let network requests pass through smoothly with cache fallback
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});

