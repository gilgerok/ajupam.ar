/* ============================================
   FIREBASE CLOUD FUNCTION
   Para envío automático de notificaciones FCM
   ============================================ */

// INSTALACIÓN:
// 1. npm install firebase-functions firebase-admin
// 2. Desplegar: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Función que se dispara cuando se crea una nueva notificación
 * Envía mensajes FCM a todos los suscriptores de la cancha
 */
exports.sendCourtNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        try {
            const notification = snap.data();
            const { courtNumber, message, sentBy } = notification;
            
            console.log(`Procesando notificación para cancha ${courtNumber}`);
            
            // Obtener todos los suscriptores de esta cancha
            const subscribersSnapshot = await admin.firestore()
                .collection('subscriptions')
                .where('courtNumber', '==', courtNumber)
                .get();
            
            if (subscribersSnapshot.empty) {
                console.log('No hay suscriptores para esta cancha');
                return null;
            }
            
            // Extraer tokens FCM únicos
            const tokens = [];
            subscribersSnapshot.forEach(doc => {
                const token = doc.data().fcmToken;
                if (token && !tokens.includes(token)) {
                    tokens.push(token);
                }
            });
            
            if (tokens.length === 0) {
                console.log('No hay tokens FCM válidos');
                return null;
            }
            
            console.log(`Enviando a ${tokens.length} dispositivos`);
            
            // Preparar el mensaje
            const payload = {
                notification: {
                    title: `¡Cancha ${courtNumber} Disponible!`,
                    body: message || `La cancha ${courtNumber} está libre para jugar`,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    tag: `court-${courtNumber}`,
                    requireInteraction: true,
                    vibrate: [200, 100, 200]
                },
                data: {
                    courtNumber: courtNumber.toString(),
                    url: '/',
                    type: 'court-available'
                }
            };
            
            // Enviar notificaciones en lotes (FCM permite 500 por lote)
            const batchSize = 500;
            const batches = [];
            
            for (let i = 0; i < tokens.length; i += batchSize) {
                const batch = tokens.slice(i, i + batchSize);
                batches.push(
                    admin.messaging().sendToDevice(batch, payload)
                );
            }
            
            // Ejecutar todos los lotes
            const results = await Promise.all(batches);
            
            // Contar éxitos y fallos
            let successCount = 0;
            let failureCount = 0;
            const tokensToRemove = [];
            
            results.forEach((result, batchIndex) => {
                result.results.forEach((response, tokenIndex) => {
                    if (response.success) {
                        successCount++;
                    } else {
                        failureCount++;
                        const error = response.error;
                        
                        // Si el token es inválido o no está registrado, marcarlo para eliminación
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            const globalIndex = batchIndex * batchSize + tokenIndex;
                            tokensToRemove.push(tokens[globalIndex]);
                        }
                    }
                });
            });
            
            console.log(`Enviado: ${successCount} exitosos, ${failureCount} fallidos`);
            
            // Limpiar tokens inválidos
            if (tokensToRemove.length > 0) {
                console.log(`Limpiando ${tokensToRemove.length} tokens inválidos`);
                
                const batch = admin.firestore().batch();
                const cleanupPromises = tokensToRemove.map(async (token) => {
                    const snapshot = await admin.firestore()
                        .collection('subscriptions')
                        .where('fcmToken', '==', token)
                        .get();
                    
                    snapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                });
                
                await Promise.all(cleanupPromises);
                await batch.commit();
            }
            
            // Actualizar el documento de notificación con los resultados
            await snap.ref.update({
                sentCount: successCount,
                failedCount: failureCount,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, sent: successCount, failed: failureCount };
            
        } catch (error) {
            console.error('Error al enviar notificaciones:', error);
            
            // Actualizar el documento con el error
            await snap.ref.update({
                error: error.message,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            throw error;
        }
    });

/**
 * Función para limpiar suscripciones antiguas (ejecutar semanalmente)
 */
exports.cleanupOldSubscriptions = functions.pubsub
    .schedule('every monday 00:00')
    .timeZone('America/Argentina/Mendoza')
    .onRun(async (context) => {
        try {
            // Eliminar suscripciones de hace más de 6 meses sin actividad
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const oldSubscriptions = await admin.firestore()
                .collection('subscriptions')
                .where('subscribedAt', '<', sixMonthsAgo)
                .get();
            
            if (oldSubscriptions.empty) {
                console.log('No hay suscripciones antiguas para limpiar');
                return null;
            }
            
            const batch = admin.firestore().batch();
            oldSubscriptions.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            console.log(`Eliminadas ${oldSubscriptions.size} suscripciones antiguas`);
            return { deleted: oldSubscriptions.size };
            
        } catch (error) {
            console.error('Error al limpiar suscripciones:', error);
            throw error;
        }
    });

/**
 * Función para generar estadísticas diarias
 */
exports.generateDailyStats = functions.pubsub
    .schedule('every day 23:59')
    .timeZone('America/Argentina/Mendoza')
    .onRun(async (context) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Obtener notificaciones del día
            const notificationsSnapshot = await admin.firestore()
                .collection('notifications')
                .where('sentAt', '>=', today)
                .get();
            
            // Calcular estadísticas
            const stats = {
                date: today,
                totalNotifications: notificationsSnapshot.size,
                notificationsByCourt: {},
                totalSubscribers: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            notificationsSnapshot.forEach(doc => {
                const data = doc.data();
                const courtNumber = data.courtNumber;
                
                if (!stats.notificationsByCourt[courtNumber]) {
                    stats.notificationsByCourt[courtNumber] = 0;
                }
                stats.notificationsByCourt[courtNumber]++;
            });
            
            // Obtener total de suscriptores únicos
            const subscribersSnapshot = await admin.firestore()
                .collection('subscriptions')
                .get();
            
            const uniqueDevices = new Set();
            subscribersSnapshot.forEach(doc => {
                uniqueDevices.add(doc.data().deviceId);
            });
            
            stats.totalSubscribers = uniqueDevices.size;
            
            // Guardar estadísticas
            await admin.firestore()
                .collection('stats')
                .add(stats);
            
            console.log('Estadísticas diarias generadas:', stats);
            return stats;
            
        } catch (error) {
            console.error('Error al generar estadísticas:', error);
            throw error;
        }
    });

/**
 * Función HTTP para testing (eliminar en producción)
 */
exports.testNotification = functions.https.onRequest(async (req, res) => {
    try {
        // Solo permitir en modo desarrollo
        if (process.env.NODE_ENV === 'production') {
            res.status(403).send('No disponible en producción');
            return;
        }
        
        const { courtNumber, message } = req.query;
        
        if (!courtNumber) {
            res.status(400).send('Falta parámetro courtNumber');
            return;
        }
        
        // Crear notificación de prueba
        const notificationRef = await admin.firestore()
            .collection('notifications')
            .add({
                courtNumber: parseInt(courtNumber),
                message: message || 'Notificación de prueba',
                sentBy: 'test',
                sentAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.status(200).json({
            success: true,
            message: 'Notificación de prueba creada',
            id: notificationRef.id
        });
        
    } catch (error) {
        console.error('Error en notificación de prueba:', error);
        res.status(500).json({ error: error.message });
    }
});
