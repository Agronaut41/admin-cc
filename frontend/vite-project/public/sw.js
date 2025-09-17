self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'Notificação';
  const options = {
    body: payload.body,
    data: payload.data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = '/motorista'; // rota destino
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list.find(c => c.url.includes(url));
      if (client) return client.focus();
      return clients.openWindow(url);
    })
  );
});