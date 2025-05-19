// sw.js

const CACHE_NAME = 'peso-y-balance-cache-v1'; // Dale un nombre y versión a tu caché
const URLS_TO_CACHE = [
    '/', // Si tu index.html es la raíz
    '/index.html',
    '/style.css',
    '/script.js',
    // Añade aquí rutas a TUS iconos, ej:
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // Si tienes más assets (otras imágenes, fuentes, etc.), añádelos también.
    // ¡NO añadas manifest.json ni sw.js a esta lista!
    // La librería de Chart.js se carga desde CDN, así que no la cachearemos aquí directamente
    // (aunque el navegador la cacheará por su cuenta). Si la tuvieras local, la añadirías.
];

// Evento 'install': se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando archivos principales');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker: Archivos principales cacheados exitosamente.');
                return self.skipWaiting(); // Fuerza al SW a activarse inmediatamente
            })
            .catch(error => {
                console.error('Service Worker: Falló el cacheo de archivos principales durante la instalación:', error);
            })
    );
});

// Evento 'activate': se dispara después de la instalación, cuando el SW se activa.
// Útil para limpiar cachés antiguas.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activado y cachés antiguas limpiadas.');
            return self.clients.claim(); // Permite que el SW controle las páginas abiertas inmediatamente
        })
    );
});

// Evento 'fetch': se dispara cada vez que la aplicación web realiza una petición de red (ej. cargar una imagen, un script, una página).
// Aquí implementamos una estrategia "Cache First, then Network".
self.addEventListener('fetch', event => {
    // No interceptar peticiones que no son GET (ej. POST)
    if (event.request.method !== 'GET') {
        return;
    }
    // Para peticiones a CDNs (como Chart.js), usar estrategia Network First o Cache then Network.
    // Por simplicidad, este ejemplo se enfoca en los archivos locales.
    // Si la URL es de un CDN, podrías simplemente dejar que la red la maneje:
    // if (event.request.url.startsWith('https://cdn.jsdelivr.net/')) {
    //    event.respondWith(fetch(event.request));
    //    return;
    // }


    event.respondWith(
        caches.match(event.request) // Intenta encontrar la petición en la caché
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('Service Worker: Sirviendo desde caché:', event.request.url);
                    return cachedResponse; // Si está en caché, la sirve desde ahí
                }
                // console.log('Service Worker: No en caché, solicitando a la red:', event.request.url);
                // Si no está en caché, va a la red
                return fetch(event.request).then(
                    networkResponse => {
                        // Opcional: Cachear la respuesta de la red para futuras peticiones
                        // Es importante clonar la respuesta porque es un stream y solo se puede consumir una vez.
                        // const responseToCache = networkResponse.clone();
                        // caches.open(CACHE_NAME)
                        //     .then(cache => {
                        //         cache.put(event.request, responseToCache);
                        //     });
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Service Worker: Error de fetch (probablemente offline y no en caché):', error, event.request.url);
                    // Opcional: Podrías devolver una página offline genérica aquí
                    // return caches.match('/offline.html');
                });
            })
    );
});