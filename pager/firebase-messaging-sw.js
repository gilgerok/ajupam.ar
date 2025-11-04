/* ============================================
   FIREBASE MESSAGING SERVICE WORKER
   ============================================ */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (la misma que en firebase-config.js)
firebase.initializeApp({
    apiKey: "AIzaSyC7qu6Egw1VFV76QIfmK-AQBKLqrmIAonc",
    authDomain: "ajupam-pager.firebaseapp.com",
    projectId: "ajupam-pager",
    storageBucket: "ajupam-pager.firebasestorage.app",
    messagingSenderId: "580303243943",
    appId: "1:580303243943:web:53becd2e3e4424cb1ba982"
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Mensaje recibido en segundo plano:', payload);
    
    const notificationTitle = payload.notification?.title || 'AJUPAM Pager';
    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: '/pager/icons/icon-192.png',
        badge: '/pager/icons/icon-72.png',
        tag: 'ajupam-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            url: payload.data?.url || '/pager/',
            courtNumber: payload.data?.courtNumber
        },
        actions: [
            {
                action: 'open',
                title: 'Ver'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Clic en notificación:', event);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        const urlToOpen = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Si ya hay una ventana abierta, enfocarla
                    for (let client of clientList) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Si no, abrir nueva ventana
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Cache de la aplicación para funcionamiento offline
const CACHE_NAME = 'ajupam-pager-v1';
const urlsToCache = [
    '/pager/',
    '/pager/index.html',
    '/pager/css/styles.css',
    '/pager/js/firebase-config.js',
    '/pager/js/app.js',
    '/pager/manifest.json',
    '/pager/icons/icon-192.png',
    '/pager/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - devolver respuesta
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});