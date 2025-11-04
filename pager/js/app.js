/* ============================================
   AJUPAM PAGER - APLICACIÓN PRINCIPAL
   ============================================ */

class AjupamPager {
    constructor() {
        this.currentUser = null;
        this.currentView = 'user';
        this.subscriptions = new Map();
        this.courts = new Map();
        this.qrScanner = null;
        
        this.init();
    }

    async init() {
        try {
            // Esperar a que Firebase esté listo
            await this.waitForFirebase();
            
            // Inicializar componentes
            this.initializeElements();
            this.attachEventListeners();
            await this.requestNotificationPermission();
            await this.loadUserSubscriptions();
            
            // Ocultar pantalla de carga
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
            }, 1500);
            
            // Escuchar cambios de autenticación
            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (user && this.currentView === 'admin') {
                    this.loadAdminDashboard();
                }
            });
            
        } catch (error) {
            console.error('Error al inicializar:', error);
            this.showToast('Error al inicializar la aplicación', 'error');
        }
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebaseApp) {
                resolve();
            } else {
                setTimeout(() => this.waitForFirebase().then(resolve), 100);
            }
        });
    }

    initializeElements() {
        this.elements = {
            // Views
            userView: document.getElementById('user-view'),
            adminView: document.getElementById('admin-view'),
            adminLogin: document.getElementById('admin-login'),
            adminDashboard: document.getElementById('admin-dashboard'),
            
            // User elements
            scanQrBtn: document.getElementById('scan-qr-btn'),
            manualCode: document.getElementById('manual-code'),
            manualSubmit: document.getElementById('manual-submit'),
            subscriptionsList: document.getElementById('subscriptions-list'),
            
            // Admin elements
            adminToggle: document.getElementById('admin-toggle'),
            loginForm: document.getElementById('login-form'),
            backToUser: document.getElementById('back-to-user'),
            logoutBtn: document.getElementById('logout-btn'),
            courtCount: document.getElementById('court-count'),
            saveConfig: document.getElementById('save-config'),
            qrCodesGrid: document.getElementById('qr-codes-grid'),
            courtsGrid: document.getElementById('courts-grid'),
            downloadAllQr: document.getElementById('download-all-qr'),
            
            // Modals
            qrScannerModal: document.getElementById('qr-scanner-modal'),
            notificationModal: document.getElementById('notification-modal'),
            notificationMessage: document.getElementById('notification-message'),
            sendNotification: document.getElementById('send-notification'),
            
            // Stats
            totalSubscribers: document.getElementById('total-subscribers'),
            notificationsToday: document.getElementById('notifications-today'),
            activeCourts: document.getElementById('active-courts')
        };
    }

    attachEventListeners() {
        // User view
        this.elements.scanQrBtn.addEventListener('click', () => this.openQrScanner());
        this.elements.manualSubmit.addEventListener('click', () => this.subscribeManual());
        this.elements.manualCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.subscribeManual();
        });
        
        // Admin toggle
        this.elements.adminToggle.addEventListener('click', () => this.switchToAdmin());
        this.elements.backToUser.addEventListener('click', () => this.switchToUser());
        
        // Admin login/logout
        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Court configuration
        document.querySelectorAll('.btn-number').forEach(btn => {
            btn.addEventListener('click', (e) => this.adjustCourtCount(e));
        });
        this.elements.saveConfig.addEventListener('click', () => this.saveCourtConfig());
        this.elements.downloadAllQr.addEventListener('click', () => this.downloadAllQr());
        
        // Notification modal
        this.elements.sendNotification.addEventListener('click', () => this.sendCourtNotification());
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
                if (this.qrScanner) {
                    this.qrScanner.stop();
                }
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    if (this.qrScanner) {
                        this.qrScanner.stop();
                    }
                }
            });
        });
    }

    // ==================== NOTIFICACIONES ====================
    
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones');
            return;
        }
        
        if (Notification.permission === 'granted') {
            await this.registerServiceWorker();
            return;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.registerServiceWorker();
                this.showToast('¡Notificaciones activadas!', 'success');
            }
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator && messaging) {
            try {
                const registration = await navigator.serviceWorker.register('/pager/firebase-messaging-sw.js', {
                    scope: '/pager/'
                });
                const token = await messaging.getToken({
                    vapidKey: 'BDvXtlHcZfdSathkkJEk9N6WcHqtz5x7lVcmzQw4hNObLfhcW8XfS63UEKmRY-3JDWBLYGr5Lr7C4IqDkvJBSvA',
                    serviceWorkerRegistration: registration
                });
                
                if (token) {
                    localStorage.setItem('fcm_token', token);
                    console.log('Token FCM:', token);
                }
            } catch (error) {
                console.error('Error al registrar service worker:', error);
            }
        }
    }

    // ==================== QR SCANNER ====================
    
    openQrScanner() {
        this.elements.qrScannerModal.classList.add('active');
        
        this.qrScanner = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };
        
        this.qrScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                this.handleQrScan(decodedText);
                this.qrScanner.stop();
                this.elements.qrScannerModal.classList.remove('active');
            },
            (errorMessage) => {
                // Silenciar errores de escaneo continuo
            }
        ).catch(err => {
            console.error('Error al iniciar scanner:', err);
            this.showToast('Error al acceder a la cámara', 'error');
            this.elements.qrScannerModal.classList.remove('active');
        });
    }

    async handleQrScan(code) {
        try {
            // Validar código (formato: AJUPAM-CANCHA-XX)
            const match = code.match(/AJUPAM-CANCHA-(\d+)/);
            if (!match) {
                this.showToast('Código QR inválido', 'error');
                return;
            }
            
            const courtNumber = parseInt(match[1]);
            await this.subscribeToCoart(courtNumber);
            
        } catch (error) {
            console.error('Error al procesar QR:', error);
            this.showToast('Error al procesar el código', 'error');
        }
    }

    async subscribeManual() {
        const code = this.elements.manualCode.value.trim().toUpperCase();
        
        if (!code) {
            this.showToast('Ingresá un código', 'error');
            return;
        }
        
        // Intentar extraer número de cancha
        const match = code.match(/(\d+)/);
        if (!match) {
            this.showToast('Código inválido', 'error');
            return;
        }
        
        const courtNumber = parseInt(match[1]);
        await this.subscribeToCoart(courtNumber);
        this.elements.manualCode.value = '';
    }

    async subscribeToCoart(courtNumber) {
        try {
            // Verificar si la cancha existe
            const courtDoc = await db.collection(COLLECTIONS.COURTS).doc(`court-${courtNumber}`).get();
            
            if (!courtDoc.exists) {
                this.showToast(`La cancha ${courtNumber} no existe`, 'error');
                return;
            }
            
            // Verificar si ya está suscripto
            if (this.subscriptions.has(courtNumber)) {
                this.showToast(`Ya estás suscripto a la cancha ${courtNumber}`, 'info');
                return;
            }
            
            // Crear ID único para el dispositivo
            const deviceId = this.getDeviceId();
            const fcmToken = localStorage.getItem('fcm_token');
            
            // Guardar suscripción en Firestore
            await db.collection(COLLECTIONS.SUBSCRIPTIONS).add({
                courtNumber,
                deviceId,
                fcmToken,
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar localmente
            this.subscriptions.set(courtNumber, {
                courtNumber,
                subscribedAt: new Date()
            });
            
            this.renderSubscriptions();
            this.showToast(`¡Suscripto a la cancha ${courtNumber}!`, 'success');
            
        } catch (error) {
            console.error('Error al suscribirse:', error);
            this.showToast('Error al suscribirse', 'error');
        }
    }

    async unsubscribeFromCourt(courtNumber) {
        try {
            const deviceId = this.getDeviceId();
            
            // Eliminar de Firestore
            const querySnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', courtNumber)
                .where('deviceId', '==', deviceId)
                .get();
            
            const batch = db.batch();
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            
            // Actualizar localmente
            this.subscriptions.delete(courtNumber);
            this.renderSubscriptions();
            
            this.showToast(`Desuscripto de la cancha ${courtNumber}`, 'success');
            
        } catch (error) {
            console.error('Error al desuscribirse:', error);
            this.showToast('Error al desuscribirse', 'error');
        }
    }

    async loadUserSubscriptions() {
        try {
            const deviceId = this.getDeviceId();
            
            const querySnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('deviceId', '==', deviceId)
                .get();
            
            this.subscriptions.clear();
            querySnapshot.forEach(doc => {
                const data = doc.data();
                this.subscriptions.set(data.courtNumber, {
                    courtNumber: data.courtNumber,
                    subscribedAt: data.subscribedAt?.toDate()
                });
            });
            
            this.renderSubscriptions();
            
        } catch (error) {
            console.error('Error al cargar suscripciones:', error);
        }
    }

    renderSubscriptions() {
        const container = this.elements.subscriptionsList;
        
        if (this.subscriptions.size === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Aún no estás suscripto a ninguna cancha</p>
                    <p class="hint">Escaneá un código QR para comenzar</p>
                </div>
            `;
            return;
        }
        
        const subscriptionsArray = Array.from(this.subscriptions.values())
            .sort((a, b) => a.courtNumber - b.courtNumber);
        
        container.innerHTML = subscriptionsArray.map(sub => `
            <div class="subscription-card">
                <div class="subscription-info">
                    <div class="subscription-icon">${sub.courtNumber}</div>
                    <div class="subscription-details">
                        <h4>Cancha ${sub.courtNumber}</h4>
                        <p>Te notificaremos cuando esté disponible</p>
                    </div>
                </div>
                <button class="unsubscribe-btn" onclick="app.unsubscribeFromCourt(${sub.courtNumber})">
                    <i class="fas fa-bell-slash"></i>
                </button>
            </div>
        `).join('');
    }

    // ==================== ADMIN ====================
    
    switchToAdmin() {
        this.currentView = 'admin';
        this.elements.userView.classList.remove('active');
        this.elements.adminView.classList.add('active');
        
        if (this.currentUser) {
            this.elements.adminLogin.style.display = 'none';
            this.elements.adminDashboard.style.display = 'block';
            this.loadAdminDashboard();
        } else {
            this.elements.adminLogin.style.display = 'flex';
            this.elements.adminDashboard.style.display = 'none';
        }
    }

    switchToUser() {
        this.currentView = 'user';
        this.elements.adminView.classList.remove('active');
        this.elements.userView.classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            this.elements.adminLogin.style.display = 'none';
            this.elements.adminDashboard.style.display = 'block';
            await this.loadAdminDashboard();
            this.showToast('Sesión iniciada', 'success');
            
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.showToast('Credenciales inválidas', 'error');
        }
    }

    async handleLogout() {
        try {
            await auth.signOut();
            this.switchToUser();
            this.showToast('Sesión cerrada', 'success');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    async loadAdminDashboard() {
        try {
            await this.loadCourtConfig();
            await this.generateQrCodes();
            await this.loadCourts();
            await this.loadStats();
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    }

    async loadCourtConfig() {
        try {
            const configDoc = await db.collection(COLLECTIONS.CONFIG).doc('courts').get();
            
            if (configDoc.exists) {
                const count = configDoc.data().count || 6;
                this.elements.courtCount.value = count;
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        }
    }

    adjustCourtCount(e) {
        const action = e.currentTarget.dataset.action;
        const input = this.elements.courtCount;
        let value = parseInt(input.value);
        
        if (action === 'increase' && value < 20) {
            input.value = value + 1;
        } else if (action === 'decrease' && value > 1) {
            input.value = value - 1;
        }
    }

    async saveCourtConfig() {
        try {
            const count = parseInt(this.elements.courtCount.value);
            
            // Guardar configuración
            await db.collection(COLLECTIONS.CONFIG).doc('courts').set({
                count,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Crear/actualizar documentos de canchas
            const batch = db.batch();
            for (let i = 1; i <= count; i++) {
                const courtRef = db.collection(COLLECTIONS.COURTS).doc(`court-${i}`);
                batch.set(courtRef, {
                    number: i,
                    active: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            await batch.commit();
            
            await this.generateQrCodes();
            await this.loadCourts();
            
            this.showToast('Configuración guardada', 'success');
            
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            this.showToast('Error al guardar', 'error');
        }
    }

    async generateQrCodes() {
        // Verificar que la librería QRCode esté cargada
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded yet, waiting...');
            await new Promise(resolve => {
                const checkQRCode = setInterval(() => {
                    if (typeof QRCode !== 'undefined') {
                        clearInterval(checkQRCode);
                        resolve();
                    }
                }, 100);
                // Timeout después de 5 segundos
                setTimeout(() => {
                    clearInterval(checkQRCode);
                    console.error('QRCode library failed to load');
                    resolve();
                }, 5000);
            });
        }
        
        if (typeof QRCode === 'undefined') {
            this.showToast('Error: No se pudo cargar la librería de códigos QR', 'error');
            return;
        }
        
        const count = parseInt(this.elements.courtCount.value);
        const container = this.elements.qrCodesGrid;
        container.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const code = `AJUPAM-CANCHA-${i}`;
            const card = document.createElement('div');
            card.className = 'qr-card';
            
            const canvas = document.createElement('canvas');
            
            try {
                await QRCode.toCanvas(canvas, code, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#0066CC',
                        light: '#FFFFFF'
                    }
                });
            } catch (error) {
                console.error(`Error generando QR para cancha ${i}:`, error);
                continue;
            }
            
            card.innerHTML = `
                <h4>CANCHA ${i}</h4>
                <div class="qr-code-img"></div>
                <div class="qr-card-actions">
                    <button class="btn-secondary small" onclick="app.downloadQr(${i})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-secondary small" onclick="app.printQr(${i})">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            `;
            
            card.querySelector('.qr-code-img').appendChild(canvas);
            container.appendChild(card);
        }
    }

    async downloadQr(courtNumber) {
        if (typeof QRCode === 'undefined') {
            this.showToast('Error: Librería de códigos QR no disponible', 'error');
            return;
        }
        
        const code = `AJUPAM-CANCHA-${courtNumber}`;
        const canvas = document.createElement('canvas');
        
        try {
            await QRCode.toCanvas(canvas, code, {
                width: 500,
                margin: 4,
                color: {
                    dark: '#0066CC',
                    light: '#FFFFFF'
                }
            });
            
            const link = document.createElement('a');
            link.download = `ajupam-cancha-${courtNumber}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Error al descargar QR:', error);
            this.showToast('Error al generar código QR', 'error');
        }
    }

    async downloadAllQr() {
        const count = parseInt(this.elements.courtCount.value);
        for (let i = 1; i <= count; i++) {
            await this.downloadQr(i);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        this.showToast(`${count} códigos QR descargados`, 'success');
    }

    printQr(courtNumber) {
        const qrCard = this.elements.qrCodesGrid.children[courtNumber - 1];
        const printWindow = window.open('', '', 'width=600,height=600');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>AJUPAM - Cancha ${courtNumber}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            font-family: 'Bebas Neue', sans-serif;
                        }
                        h1 {
                            font-size: 48px;
                            color: #0066CC;
                            margin: 20px 0;
                        }
                        canvas {
                            border: 4px solid #0066CC;
                            padding: 20px;
                        }
                        p {
                            font-size: 24px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h1>CANCHA ${courtNumber}</h1>
                    ${qrCard.querySelector('.qr-code-img').innerHTML}
                    <p>Escaneá para recibir notificaciones</p>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    async loadCourts() {
        const count = parseInt(this.elements.courtCount.value);
        const container = this.elements.courtsGrid;
        container.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            // Obtener número de suscriptores
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', i)
                .get();
            
            const subscribersCount = subscribersSnapshot.size;
            
            const card = document.createElement('div');
            card.className = 'court-card';
            card.innerHTML = `
                <div class="court-number">${i}</div>
                <div class="court-info">
                    <i class="fas fa-users"></i>
                    <span>${subscribersCount} suscriptor${subscribersCount !== 1 ? 'es' : ''}</span>
                </div>
                <button class="btn-primary court-notify-btn" onclick="app.openNotificationModal(${i})">
                    <i class="fas fa-bell"></i>
                    <span>NOTIFICAR DISPONIBLE</span>
                </button>
            `;
            
            container.appendChild(card);
            this.courts.set(i, { number: i, subscribers: subscribersCount });
        }
    }

    openNotificationModal(courtNumber) {
        this.selectedCourt = courtNumber;
        document.getElementById('notification-title').textContent = `CANCHA ${courtNumber} DISPONIBLE`;
        this.elements.notificationMessage.value = '';
        this.elements.notificationModal.classList.add('active');
    }

    async sendCourtNotification() {
        try {
            const courtNumber = this.selectedCourt;
            const message = this.elements.notificationMessage.value.trim();
            
            // Obtener todos los suscriptores de esta cancha
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', courtNumber)
                .get();
            
            if (subscribersSnapshot.empty) {
                this.showToast('No hay suscriptores para esta cancha', 'info');
                return;
            }
            
            // Guardar notificación en Firestore (Cloud Function la enviará)
            await db.collection(COLLECTIONS.NOTIFICATIONS).add({
                courtNumber,
                message: message || `¡La cancha ${courtNumber} está libre!`,
                subscriberCount: subscribersSnapshot.size,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
                sentBy: this.currentUser.email
            });
            
            // En producción, una Cloud Function procesaría esto y enviaría via FCM
            // Por ahora simulamos el envío
            this.showToast(`Notificación enviada a ${subscribersSnapshot.size} usuario${subscribersSnapshot.size !== 1 ? 's' : ''}`, 'success');
            
            this.elements.notificationModal.classList.remove('active');
            await this.loadStats();
            
        } catch (error) {
            console.error('Error al enviar notificación:', error);
            this.showToast('Error al enviar notificación', 'error');
        }
    }

    async loadStats() {
        try {
            // Total de suscriptores únicos
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS).get();
            const uniqueDevices = new Set();
            subscribersSnapshot.forEach(doc => uniqueDevices.add(doc.data().deviceId));
            this.elements.totalSubscribers.textContent = uniqueDevices.size;
            
            // Notificaciones hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const notificationsSnapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
                .where('sentAt', '>=', today)
                .get();
            this.elements.notificationsToday.textContent = notificationsSnapshot.size;
            
            // Canchas activas
            const courtsSnapshot = await db.collection(COLLECTIONS.COURTS)
                .where('active', '==', true)
                .get();
            this.elements.activeCourts.textContent = courtsSnapshot.size;
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    // ==================== UTILIDADES ====================
    
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        const titles = {
            success: 'Éxito',
            error: 'Error',
            info: 'Información'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AjupamPager();
});