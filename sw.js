// sw.js
const CACHE_NAME = 'peso-y-balance-cache-v2.2'; // Incrementa si cambias los archivos cacheados
const URLS_TO_CACHE = [
    './', // Representa index.html en el directorio actual del sw.js
    './index.html',
    './style.css',
    './script.js',
    './manifest.json', // Cachear el manifiesto
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './favicon.ico'
];

self.addEventListener('install', event => {
    console.log('SW: Instalando v1...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cacheando archivos principales');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                console.log('SW: Archivos principales cacheados exitosamente.');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Falló el cacheo de archivos principales durante la instalación:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('SW: Activando v1...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Activado y cachés antiguas limpiadas.');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('SW: Sirviendo desde caché:', event.request.url);
                    return cachedResponse;
                }
                // console.log('SW: No en caché, solicitando a la red:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // Opcional: si quieres cachear dinámicamente nuevas peticiones no listadas en URLS_TO_CACHE
                        // if (networkResponse.status === 200 && !event.request.url.startsWith('https://cdn.jsdelivr.net/')) {
                        //     const responseToCache = networkResponse.clone();
                        //     caches.open(CACHE_NAME).then(cache => {
                        //         cache.put(event.request, responseToCache);
                        //     });
                        // }
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('SW: Error de fetch:', error, event.request.url);
                    // Podrías devolver una página offline.html aquí si la tienes
                    // if (event.request.mode === 'navigate') { // Solo para navegación de página
                    //    return caches.match('./offline.html');
                    // }
                });
            })
    );
});