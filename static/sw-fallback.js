/* eslint-disable no-restricted-globals */
// Service Worker with CDN Fallback
const ORIGIN_URL = 'https://aniketwebsiteblob.z30.web.core.windows.net';
const CDN_HOST = 'www.aniketbiswas.dev';

// Install immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate immediately
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Intercept all fetch requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle requests to our CDN
  if (url.host !== CDN_HOST) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If CDN returns 404, try origin
        if (response.status === 404) {
          const originUrl = `${ORIGIN_URL}${url.pathname}${url.search}`;
          return fetch(originUrl, { mode: 'cors' })
            .then(originResponse => {
              if (originResponse.ok) {
                return originResponse;
              }
              return response; // Return original 404 if origin also fails
            })
            .catch(() => response);
        }
        return response;
      })
      .catch(() => {
        // Network error - try origin
        const originUrl = `${ORIGIN_URL}${url.pathname}${url.search}`;
        return fetch(originUrl, { mode: 'cors' });
      }),
  );
});
