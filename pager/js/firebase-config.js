/* ============================================
   FIREBASE CONFIGURATION
   AJUPAM PAGER - Configuración del Cliente
   ============================================ */

// Configuración Firebase - AJUPAM Pager
const firebaseConfig = {
    apiKey: "AIzaSyC7qu6Egw1VFV76QIfmK-AQBKLqrmIAonc",
    authDomain: "ajupam-pager.firebaseapp.com",
    projectId: "ajupam-pager",
    storageBucket: "ajupam-pager.firebasestorage.app",
    messagingSenderId: "580303243943",
    appId: "1:580303243943:web:53becd2e3e4424cb1ba982"
};

// VAPID Key para Cloud Messaging
const vapidKey = "BDvXtlHcZfdSathkkJEk9N6WcHqtz5x7lVcmzQw4hNObLfhcW8XfS63UEKmRY-3JDWBLYGr5Lr7C4IqDkvJBSvA";

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

// Configurar persistencia de Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistencia no disponible: múltiples pestañas abiertas');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistencia no disponible en este navegador');
        }
    });

// Configurar messaging con VAPID key
messaging.getToken({ vapidKey: vapidKey })
    .then((currentToken) => {
        if (currentToken) {
            console.log('FCM Token obtenido:', currentToken);
            // Este token se usará automáticamente en app.js
        } else {
            console.log('No hay token disponible. Solicitar permisos de notificación.');
        }
    })
    .catch((err) => {
        console.error('Error al obtener token FCM:', err);
    });

// Manejar mensajes cuando la app está en primer plano
messaging.onMessage((payload) => {
    console.log('Mensaje recibido en primer plano:', payload);
    
    // Mostrar notificación personalizada
    const notificationTitle = payload.notification?.title || 'AJUPAM Pager';
    const notificationOptions = {
        body: payload.notification?.body || 'Nueva notificación',
        icon: '/pager/icons/icon-192.png',
        badge: '/pager/icons/icon-72.png',
        tag: 'ajupam-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data
    };
    
    // Si el navegador soporta notificaciones
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
    }
    
    // También mostrar un toast en la app
    if (typeof showToast === 'function') {
        showToast(payload.notification?.body || 'Nueva notificación', 'success');
    }
});

console.log('🔥 Firebase inicializado correctamente - AJUPAM Pager');