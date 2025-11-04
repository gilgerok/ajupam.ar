/* ============================================
   FIREBASE CONFIGURATION
   ============================================ */

// INSTRUCCIONES PARA CONFIGURAR FIREBASE:
// 1. Crear un proyecto en https://console.firebase.google.com/
// 2. Habilitar Authentication (Email/Password)
// 3. Habilitar Firestore Database
// 4. Habilitar Cloud Messaging
// 5. Reemplazar la configuración abajo con tus credenciales

const firebaseConfig = {
    apiKey: "AIzaSyC7qu6Egw1VFV76QIfmK-AQBKLqrmIAonc",
    authDomain: "ajupam-pager.firebaseapp.com",
    projectId: "ajupam-pager",
    storageBucket: "ajupam-pager.firebasestorage.app",
    messagingSenderId: "580303243943",
    appId: "1:580303243943:web:53becd2e3e4424cb1ba982"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios
const db = firebase.firestore();
const auth = firebase.auth();
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

// Colecciones
const COLLECTIONS = {
    COURTS: 'courts',
    SUBSCRIPTIONS: 'subscriptions',
    NOTIFICATIONS: 'notifications',
    CONFIG: 'config'
};

// Configuración de persistencia
firebase.firestore().enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistencia no disponible: múltiples tabs abiertas');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistencia no soportada por el navegador');
        }
    });

// Exportar referencias
window.firebaseApp = {
    db,
    auth,
    messaging,
    COLLECTIONS
};
