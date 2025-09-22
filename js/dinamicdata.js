/**
 * ========================================
 * 🚀 DINAMICDATA.JS v1.0 - AJuPaM
 * ========================================
 * 
 * Sistema independiente para datos dinámicos desde Google Sheets
 * 
 * USO:
 * - Estadísticas: <span data-stat="concepto">valor</span>
 * - Enlaces: <a href="#" data-link="concepto">Texto</a>
 * 
 * FUNCIONES GLOBALES:
 * - debugDatos() - Ver elementos encontrados
 * - actualizarDatos() - Forzar actualización
 */

(function(window, document) {
    'use strict';

    // ===============================
    // 📊 CONFIGURACIÓN
    // ===============================
    
    const CONFIG = {
        // ID de tu Google Sheets
        SHEET_ID: '1fCV4Dcw3mKnMaSJAkf2K3mm_y4zam9s6S5vnjLiK3tE',
        SHEET_NAME: 'Hoja 1',
        
        // Configuración de funcionamiento
        DEBUG_MODE: true,
        AUTO_RETRY: true,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        
        // Actualización automática (en milisegundos, 0 = deshabilitado)
        AUTO_UPDATE_INTERVAL: 0, // 300000 = 5 minutos
    };

    // ===============================
    // 🔄 CARGA DE DATOS
    // ===============================
    
    async function cargarDatosGoogleSheets() {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
        
        if (CONFIG.DEBUG_MODE) {
            console.log('🌟 DynamicData.js v1.0 - Iniciando...');
            console.log('📡 Google Sheets URL:', url);
        }

        for (let intento = 1; intento <= CONFIG.RETRY_ATTEMPTS; intento++) {
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const csvData = await response.text();
                if (!csvData || csvData.trim().length === 0) {
                    throw new Error('Datos CSV vacíos');
                }

                return procesarCSV(csvData);

            } catch (error) {
                console.warn(`⚠️ Intento ${intento}/${CONFIG.RETRY_ATTEMPTS} falló:`, error.message);
                
                if (intento < CONFIG.RETRY_ATTEMPTS && CONFIG.AUTO_RETRY) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                } else {
                    console.error('❌ Error final cargando datos:', error);
                    return { estadisticas: {}, enlaces: {} };
                }
            }
        }
    }

    function procesarCSV(csvData) {
        const filas = csvData.split('\n').filter(fila => fila.trim());
        const datos = { estadisticas: {}, enlaces: {} };
        let procesados = 0;

        // Procesar cada fila (saltear encabezado)
        for (let i = 1; i < filas.length; i++) {
            const columnas = parsearFilaCSV(filas[i]);
            
            if (columnas.length >= 2) {
                const concepto = columnas[0]?.replace(/"/g, '').trim();
                const valor = columnas[1]?.replace(/"/g, '').trim();
                
                if (concepto && valor) {
                    // Clasificar por tipo
                    if (concepto.startsWith('link_')) {
                        datos.enlaces[concepto] = valor;
                    } else {
                        datos.estadisticas[concepto] = valor;
                    }
                    procesados++;
                }
            }
        }

        if (CONFIG.DEBUG_MODE) {
            console.log(`✅ Procesados: ${procesados} elementos`);
            console.log(`📊 Estadísticas: ${Object.keys(datos.estadisticas).length}`);
            console.log(`🔗 Enlaces: ${Object.keys(datos.enlaces).length}`);
        }

        return datos;
    }

    function parsearFilaCSV(fila) {
        const resultado = [];
        let dentroComillas = false;
        let valorActual = '';
        
        for (let i = 0; i < fila.length; i++) {
            const char = fila[i];
            
            if (char === '"') {
                dentroComillas = !dentroComillas;
            } else if (char === ',' && !dentroComillas) {
                resultado.push(valorActual);
                valorActual = '';
            } else {
                valorActual += char;
            }
        }
        
        resultado.push(valorActual);
        return resultado;
    }

    // ===============================
    // 📊 ACTUALIZACIÓN DE ESTADÍSTICAS
    // ===============================
    
    function actualizarEstadisticas(estadisticas) {
        let actualizados = 0;

        Object.entries(estadisticas).forEach(([concepto, valorNuevo]) => {
            // Buscar elementos con data-stat="concepto"
            const elementos = document.querySelectorAll(`[data-stat="${concepto}"]`);
            
            elementos.forEach(elemento => {
                const valorAnterior = elemento.textContent.trim();
                
                // Solo actualizar si el valor cambió
                if (valorAnterior !== valorNuevo) {
                    elemento.textContent = valorNuevo;
                    
                    // Trigger evento personalizado para animaciones externas
                    elemento.dispatchEvent(new CustomEvent('dataUpdated', {
                        detail: { 
                            concepto, 
                            valorAnterior, 
                            valorNuevo,
                            elemento 
                        }
                    }));
                    
                    if (CONFIG.DEBUG_MODE) {
                        console.log(`📊 ${concepto}: "${valorAnterior}" → "${valorNuevo}"`);
                    }
                    
                    actualizados++;
                }
            });
        });

        return actualizados;
    }

    // ===============================
    // 🔗 ACTUALIZACIÓN DE ENLACES
    // ===============================
    
    function actualizarEnlaces(enlaces) {
        let actualizados = 0;

        Object.entries(enlaces).forEach(([concepto, valorNuevo]) => {
            // Buscar elementos con data-link="concepto"
            const elementos = document.querySelectorAll(`[data-link="${concepto}"]`);
            
            elementos.forEach(elemento => {
                if (elemento.tagName.toLowerCase() === 'a') {
                    const valorAnterior = elemento.href;
                    
                    // Solo actualizar si el valor cambió
                    if (valorAnterior !== valorNuevo) {
                        elemento.href = valorNuevo;
                        
                        // Trigger evento personalizado
                        elemento.dispatchEvent(new CustomEvent('linkUpdated', {
                            detail: { 
                                concepto, 
                                valorAnterior, 
                                valorNuevo,
                                elemento 
                            }
                        }));
                        
                        if (CONFIG.DEBUG_MODE) {
                            console.log(`🔗 ${concepto}: "${valorNuevo}"`);
                        }
                        
                        actualizados++;
                    }
                }
            });
        });

        return actualizados;
    }

    // ===============================
    // 🎯 FUNCIÓN PRINCIPAL
    // ===============================
    
    async function ejecutarActualizacion() {
        try {
            const { estadisticas, enlaces } = await cargarDatosGoogleSheets();
            
            const statsActualizados = actualizarEstadisticas(estadisticas);
            const linksActualizados = actualizarEnlaces(enlaces);
            const totalActualizados = statsActualizados + linksActualizados;
            
            if (CONFIG.DEBUG_MODE) {
                console.log(`🎉 RESUMEN: ${statsActualizados} estadísticas + ${linksActualizados} enlaces = ${totalActualizados} total`);
            }
            
            // Evento global de finalización
            window.dispatchEvent(new CustomEvent('dinamicDataLoaded', {
                detail: { 
                    estadisticas, 
                    enlaces, 
                    statsActualizados,
                    linksActualizados,
                    totalActualizados,
                    timestamp: new Date()
                }
            }));
            
            return { estadisticas, enlaces, totalActualizados };
            
        } catch (error) {
            console.error('❌ Error en actualización:', error);
            
            // Evento de error
            window.dispatchEvent(new CustomEvent('dinamicDataError', {
                detail: { error, timestamp: new Date() }
            }));
            
            return null;
        }
    }

    // ===============================
    // 🛠️ FUNCIONES PÚBLICAS
    // ===============================
    
    // Función de debug
    function debugDatos() {
        console.log('🔍 DEBUG DINAMIC DATA:');
        
        const statsElements = document.querySelectorAll('[data-stat]');
        const linkElements = document.querySelectorAll('[data-link]');
        
        console.log(`📊 Elementos con data-stat encontrados: ${statsElements.length}`);
        statsElements.forEach(el => {
            const stat = el.getAttribute('data-stat');
            const valor = el.textContent.trim();
            console.log(`  📊 data-stat="${stat}" → "${valor}"`);
        });
        
        console.log(`🔗 Elementos con data-link encontrados: ${linkElements.length}`);
        linkElements.forEach(el => {
            const link = el.getAttribute('data-link');
            const href = el.href;
            console.log(`  🔗 data-link="${link}" → "${href}"`);
        });
        
        return {
            statsCount: statsElements.length,
            linksCount: linkElements.length,
            total: statsElements.length + linkElements.length
        };
    }

    // Función de actualización manual
    function actualizarDatos() {
        console.log('🔄 Actualizando datos manualmente...');
        return ejecutarActualizacion();
    }

    // Función para cambiar configuración
    function configurar(opciones) {
        Object.assign(CONFIG, opciones);
        console.log('⚙️ Configuración actualizada:', CONFIG);
    }

    // ===============================
    // 🚀 INICIALIZACIÓN
    // ===============================
    
    function inicializar() {
        if (CONFIG.DEBUG_MODE) {
            console.log('🚀 Inicializando DynamicData.js...');
        }

        // Ejecutar primera actualización
        ejecutarActualizacion();

        // Configurar actualización automática si está habilitada
        if (CONFIG.AUTO_UPDATE_INTERVAL > 0) {
            setInterval(ejecutarActualizacion, CONFIG.AUTO_UPDATE_INTERVAL);
            console.log(`⏰ Auto-actualización cada ${CONFIG.AUTO_UPDATE_INTERVAL / 1000} segundos`);
        }

        // Observer para detectar nuevos elementos
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                let needsUpdate = false;
                
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.hasAttribute && (
                                node.hasAttribute('data-stat') || 
                                node.hasAttribute('data-link') ||
                                node.querySelector('[data-stat], [data-link]')
                            )) {
                                needsUpdate = true;
                            }
                        }
                    });
                });
                
                if (needsUpdate) {
                    setTimeout(ejecutarActualizacion, 500);
                }
            });

            // Observar cuando el body esté disponible
            const startObserving = () => {
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                } else {
                    setTimeout(startObserving, 100);
                }
            };
            
            startObserving();
        }
    }

    // ===============================
    // 🌐 EXPOSICIÓN PÚBLICA
    // ===============================
    
    // Exponer funciones globalmente
    window.debugDatos = debugDatos;
    window.actualizarDatos = actualizarDatos;
    window.configurarDatos = configurar;
    
    // Exponer objeto principal
    window.DynamicData = {
        debug: debugDatos,
        actualizar: actualizarDatos,
        configurar: configurar,
        version: '1.0'
    };

    // ===============================
    // 🎬 AUTO-INICIO
    // ===============================
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        // DOM ya cargado
        setTimeout(inicializar, 100);
    }

})(window, document);