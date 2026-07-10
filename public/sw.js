// Minimal service worker: push notifications only, no offline caching.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // Non-JSON payload — fall back to defaults below.
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Solo Leveling Challenge', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if ('focus' in win) return win.focus()
      }
      return clients.openWindow(url)
    })
  )
})
