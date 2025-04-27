self.addEventListener('install', event => {
    console.log('[SW] Installed');
    self.skipWaiting(); // Immediately activate the new SW
  });
  
  self.addEventListener('activate', event => {
    console.log('[SW] Activated');
    return self.clients.claim(); // Take control of open clients
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request)); // Simple passthrough fetch
  });
  
  self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
      self.skipWaiting();
    }
  });
  