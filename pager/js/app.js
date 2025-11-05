/* ============================================
   AJUPAM PAGER - APLICACIÓN REDISEÑADA
   ============================================ */

class AjupamPager {
    constructor() {
        this.currentUser = null;
        this.currentView = 'user';
        this.subscriptions = new Set();
        this.courts = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.waitForFirebase();
            this.initializeElements();
            this.attachEventListeners();
            await this.requestNotificationPermission();
            
            // Cargar canchas disponibles para el usuario
            await this.loadUserCourts();
            
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
            }, 1500);
            
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
            userView: document.getElementById('user-view'),
            adminView: document.getElementById('admin-view'),
            adminLogin: document.getElementById('admin-login'),
            adminDashboard: document.getElementById('admin-dashboard'),
            
            userCourtsList: document.getElementById('user-courts-list'),
            
            adminToggle: document.getElementById('admin-toggle'),
            loginForm: document.getElementById('login-form'),
            backToUser: document.getElementById('back-to-user'),
            logoutBtn: document.getElementById('logout-btn'),
            courtCount: document.getElementById('court-count'),
            saveConfig: document.getElementById('save-config'),
            qrCodeSingle: document.getElementById('qr-code-single'),
            downloadQr: document.getElementById('download-qr'),
            printQr: document.getElementById('print-qr'),
            courtsGrid: document.getElementById('courts-grid'),
            
            notificationModal: document.getElementById('notification-modal'),
            notificationMessage: document.getElementById('notification-message'),
            sendNotification: document.getElementById('send-notification'),
            
            totalSubscribers: document.getElementById('total-subscribers'),
            notificationsToday: document.getElementById('notifications-today'),
            activeCourts: document.getElementById('active-courts')
        };
    }

    attachEventListeners() {
        this.elements.adminToggle.addEventListener('click', () => this.switchToAdmin());
        this.elements.backToUser.addEventListener('click', () => this.switchToUser());
        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        document.querySelectorAll('.btn-number').forEach(btn => {
            btn.addEventListener('click', (e) => this.adjustCourtCount(e));
        });
        this.elements.saveConfig.addEventListener('click', () => this.saveCourtConfig());
        this.elements.downloadQr?.addEventListener('click', () => this.downloadMainQr());
        this.elements.printQr?.addEventListener('click', () => this.printMainQr());
        
        this.elements.sendNotification.addEventListener('click', () => this.sendCourtNotification());
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
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
                    console.log('Token FCM registrado');
                }
            } catch (error) {
                console.error('Error al registrar service worker:', error);
            }
        }
    }

    // ==================== VISTA DE USUARIO ====================
    
    async loadUserCourts() {
        try {
            const deviceId = this.getDeviceId();
            
            // Cargar todas las canchas
            const courtsSnapshot = await db.collection(COLLECTIONS.COURTS)
                .orderBy('number')
                .get();
            
            // Cargar suscripciones del usuario
            const subscriptionsSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('deviceId', '==', deviceId)
                .get();
            
            this.subscriptions.clear();
            subscriptionsSnapshot.forEach(doc => {
                this.subscriptions.add(doc.data().courtNumber);
            });
            
            this.renderUserCourts(courtsSnapshot);
            
        } catch (error) {
            console.error('Error al cargar canchas:', error);
            this.elements.userCourtsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar las canchas</p>
                    <button class="btn-primary" onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    renderUserCourts(courtsSnapshot) {
        const container = this.elements.userCourtsList;
        
        if (courtsSnapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Aún no hay canchas disponibles</p>
                    <p class="hint">Contacta al administrador</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        courtsSnapshot.forEach(doc => {
            const court = doc.data();
            const isSubscribed = this.subscriptions.has(court.number);
            const isActive = court.active !== false;
            
            const card = document.createElement('div');
            card.className = `user-court-card ${isSubscribed ? 'subscribed' : ''} ${!isActive ? 'disabled' : ''}`;
            card.dataset.courtNumber = court.number;
            
            if (isActive) {
                card.addEventListener('click', () => this.toggleCourtSubscription(court.number));
            }
            
            card.innerHTML = `
                <div class="user-court-info">
                    <div class="user-court-number">${court.number}</div>
                    <div class="user-court-details">
                        <h4>Cancha ${court.number}</h4>
                        <p>${isActive ? (isSubscribed ? 'Notificaciones activadas' : 'Toca para activar notificaciones') : 'Cancha no disponible'}</p>
                    </div>
                </div>
                <label class="user-court-toggle">
                    <input type="checkbox" ${isSubscribed ? 'checked' : ''} ${!isActive ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            
            // Prevenir que el click en el toggle propague al card
            const toggle = card.querySelector('input');
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            container.appendChild(card);
        });
    }

    async toggleCourtSubscription(courtNumber) {
        try {
            const isSubscribed = this.subscriptions.has(courtNumber);
            
            if (isSubscribed) {
                await this.unsubscribeFromCourt(courtNumber);
            } else {
                await this.subscribeToCourt(courtNumber);
            }
            
        } catch (error) {
            console.error('Error al cambiar suscripción:', error);
            this.showToast('Error al actualizar suscripción', 'error');
        }
    }

    async subscribeToCourt(courtNumber) {
        try {
            const deviceId = this.getDeviceId();
            const fcmToken = localStorage.getItem('fcm_token');
            
            await db.collection(COLLECTIONS.SUBSCRIPTIONS).add({
                courtNumber,
                deviceId,
                fcmToken,
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.subscriptions.add(courtNumber);
            await this.loadUserCourts();
            
            this.showToast(`¡Suscripto a la cancha ${courtNumber}!`, 'success');
            
        } catch (error) {
            console.error('Error al suscribirse:', error);
            this.showToast('Error al suscribirse', 'error');
        }
    }

    async unsubscribeFromCourt(courtNumber) {
        try {
            const deviceId = this.getDeviceId();
            
            const querySnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', courtNumber)
                .where('deviceId', '==', deviceId)
                .get();
            
            const batch = db.batch();
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            
            this.subscriptions.delete(courtNumber);
            await this.loadUserCourts();
            
            this.showToast(`Desuscripto de la cancha ${courtNumber}`, 'success');
            
        } catch (error) {
            console.error('Error al desuscribirse:', error);
            this.showToast('Error al desuscribirse', 'error');
        }
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
            await this.generateMainQr();
            await this.loadAdminCourts();
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
            
            await db.collection(COLLECTIONS.CONFIG).doc('courts').set({
                count,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
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
            
            await this.loadAdminCourts();
            
            this.showToast('Configuración guardada', 'success');
            
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            this.showToast('Error al guardar', 'error');
        }
    }

    async generateMainQr() {
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded yet, waiting...');
            await new Promise(resolve => {
                const checkQRCode = setInterval(() => {
                    if (typeof QRCode !== 'undefined') {
                        clearInterval(checkQRCode);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkQRCode);
                    resolve();
                }, 5000);
            });
        }
        
        if (typeof QRCode === 'undefined') {
            this.elements.qrCodeSingle.innerHTML = '<p style="color: red;">Error: No se pudo cargar la librería QR</p>';
            return;
        }
        
        const container = this.elements.qrCodeSingle;
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        
        try {
            await QRCode.toCanvas(canvas, 'https://ajupam.ar/pager/', {
                width: 280,
                margin: 2,
                color: {
                    dark: '#0066CC',
                    light: '#FFFFFF'
                }
            });
            
            container.appendChild(canvas);
        } catch (error) {
            console.error('Error generando QR:', error);
            container.innerHTML = '<p style="color: red;">Error al generar código QR</p>';
        }
    }

    async downloadMainQr() {
        if (typeof QRCode === 'undefined') {
            this.showToast('Error: Librería de códigos QR no disponible', 'error');
            return;
        }
        
        const canvas = document.createElement('canvas');
        
        try {
            await QRCode.toCanvas(canvas, 'https://ajupam.ar/pager/', {
                width: 500,
                margin: 4,
                color: {
                    dark: '#0066CC',
                    light: '#FFFFFF'
                }
            });
            
            const link = document.createElement('a');
            link.download = 'ajupam-pager-qr.png';
            link.href = canvas.toDataURL();
            link.click();
            
            this.showToast('Código QR descargado', 'success');
        } catch (error) {
            console.error('Error al descargar QR:', error);
            this.showToast('Error al generar código QR', 'error');
        }
    }

    printMainQr() {
        const printWindow = window.open('', '', 'width=600,height=600');
        const qrCanvas = this.elements.qrCodeSingle.querySelector('canvas');
        
        if (!qrCanvas) {
            this.showToast('Error: QR no disponible', 'error');
            return;
        }
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>AJUPAM Pager - Código QR</title>
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
                            color: #333;
                        }
                        .url {
                            font-size: 18px;
                            color: #666;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <h1>AJUPAM PAGER</h1>
                    ${qrCanvas.outerHTML}
                    <p>Escaneá para recibir notificaciones</p>
                    <p class="url">ajupam.ar/pager</p>
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

    async loadAdminCourts() {
        const count = parseInt(this.elements.courtCount.value);
        const container = this.elements.courtsGrid;
        container.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const courtDoc = await db.collection(COLLECTIONS.COURTS).doc(`court-${i}`).get();
            const court = courtDoc.data() || { number: i, active: true };
            
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', i)
                .get();
            
            const card = document.createElement('div');
            card.className = `court-card admin-court-card ${!court.active ? 'disabled-court' : ''}`;
            card.innerHTML = `
                <span class="admin-court-status ${court.active ? 'enabled' : 'disabled'}">
                    ${court.active ? 'Activa' : 'Deshabilitada'}
                </span>
                <div class="court-number">${i}</div>
                <div class="court-info">
                    <i class="fas fa-users"></i>
                    <span>${subscribersSnapshot.size} suscriptor${subscribersSnapshot.size !== 1 ? 'es' : ''}</span>
                </div>
                <div class="admin-court-actions">
                    <button class="btn-primary court-notify-btn" ${!court.active ? 'disabled' : ''} 
                            onclick="app.openNotificationModal(${i})">
                        <i class="fas fa-bell"></i>
                        <span>NOTIFICAR DISPONIBLE</span>
                    </button>
                    <button class="btn-secondary" onclick="app.toggleCourtStatus(${i}, ${!court.active})">
                        <i class="fas fa-${court.active ? 'ban' : 'check'}"></i>
                        <span>${court.active ? 'Deshabilitar' : 'Habilitar'}</span>
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        }
    }

    async toggleCourtStatus(courtNumber, enable) {
        try {
            await db.collection(COLLECTIONS.COURTS).doc(`court-${courtNumber}`).update({
                active: enable
            });
            
            await this.loadAdminCourts();
            
            this.showToast(`Cancha ${courtNumber} ${enable ? 'habilitada' : 'deshabilitada'}`, 'success');
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            this.showToast('Error al cambiar estado de la cancha', 'error');
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
            
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
                .where('courtNumber', '==', courtNumber)
                .get();
            
            if (subscribersSnapshot.empty) {
                this.showToast('No hay suscriptores para esta cancha', 'info');
                return;
            }
            
            await db.collection(COLLECTIONS.NOTIFICATIONS).add({
                courtNumber,
                message: message || `¡La cancha ${courtNumber} está libre!`,
                subscriberCount: subscribersSnapshot.size,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
                sentBy: this.currentUser.email
            });
            
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
            const subscribersSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS).get();
            const uniqueDevices = new Set();
            subscribersSnapshot.forEach(doc => uniqueDevices.add(doc.data().deviceId));
            this.elements.totalSubscribers.textContent = uniqueDevices.size;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const notificationsSnapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
                .where('sentAt', '>=', today)
                .get();
            this.elements.notificationsToday.textContent = notificationsSnapshot.size;
            
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

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AjupamPager();
});