// 🎯 AJUPAM - Datos Dinámicos desde Google Sheets
// Este archivo conecta tu planilla de Google Sheets con la web

// ✅ CONFIGURACIÓN
const SHEET_ID = '1fCV4Dcw3mKnMaSJAkf2K3mm_y4zam9s6S5vnjLiK3tE';
const SHEET_NAME = 'Hoja 1'; // Cambiá si tu hoja tiene otro nombre
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// 📊 MAPEO: Conecta los nombres de tu planilla con los elementos de la web
const DATA_MAPPING = {
    'parejas_inscriptas': 'data-target="180"',
    'partidos_jugados': 'data-target="1000"', 
    'sedes_provincia': 'data-target="53"',
    'espectadores_finales': 'data-target="350"',
    'departamentos': 'data-target="9"' // El nuevo que agregaste
};

// 🔄 FUNCIÓN PRINCIPAL
async function actualizarDatosDinamicos() {
    try {
        console.log('🔄 Cargando datos desde Google Sheets...');
        
        // Obtener datos de la planilla
        const response = await fetch(API_URL);
        const csvText = await response.text();
        
        // Convertir CSV a datos utilizables
        const datos = parsearCSV(csvText);
        console.log('📊 Datos obtenidos:', datos);
        
        // Actualizar cada elemento en la web
        Object.keys(DATA_MAPPING).forEach(concepto => {
            const valor = datos[concepto];
            if (valor !== undefined) {
                actualizarElemento(concepto, valor);
            }
        });
        
        console.log('✅ Todos los datos actualizados correctamente');
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        // Si hay error, la web sigue funcionando con los valores originales
    }
}

// 🔧 FUNCIÓN PARA CONVERTIR CSV A OBJETO
function parsearCSV(csvText) {
    const lineas = csvText.split('\n');
    const datos = {};
    
    // Saltar la primera línea (headers) y procesar el resto
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (linea) {
            // Separar por comas y limpiar comillas
            const [concepto, valor] = linea.split(',').map(item => 
                item.replace(/"/g, '').trim()
            );
            
            if (concepto && valor) {
                // Convertir a número si es posible
                datos[concepto] = isNaN(valor) ? valor : parseInt(valor);
            }
        }
    }
    
    return datos;
}

// 🎯 FUNCIÓN PARA ACTUALIZAR UN ELEMENTO ESPECÍFICO
function actualizarElemento(concepto, valor) {
    // Buscar elementos que tengan el data-target correspondiente
    const elementos = document.querySelectorAll(`[data-target]`);
    
    elementos.forEach(elemento => {
        const target = elemento.getAttribute('data-target');
        
        // Verificar si este elemento corresponde al concepto
        if (debeActualizar(concepto, target)) {
            console.log(`🔄 Actualizando ${concepto}: ${target} → ${valor}`);
            
            // Actualizar el data-target
            elemento.setAttribute('data-target', valor);
            
            // Si el elemento ya tiene contenido, actualizarlo inmediatamente
            const prefix = elemento.getAttribute('data-prefix') || '';
            elemento.textContent = prefix + valor;
            
            // Marcar como actualizado para evitar animaciones innecesarias
            elemento.classList.add('dynamically-updated');
        }
    });
    
    // También actualizar números hardcodeados en textos
    actualizarTextosHardcodeados(concepto, valor);
}

// 🔍 FUNCIÓN PARA VERIFICAR SI UN ELEMENTO DEBE ACTUALIZARSE
function debeActualizar(concepto, target) {
    const mapeo = {
        'parejas_inscriptas': ['180'],
        'partidos_jugados': ['1000'],
        'sedes_provincia': ['53'],
        'espectadores_finales': ['350'],
        'departamentos': ['9']
    };
    
    return mapeo[concepto] && mapeo[concepto].includes(target);
}

// 📝 FUNCIÓN PARA ACTUALIZAR TEXTOS HARDCODEADOS
function actualizarTextosHardcodeados(concepto, valor) {
    // Casos específicos donde los números aparecen como texto
    const textUpdates = {
        'parejas_inscriptas': [
            { selector: '.stat-label', oldText: '180', newText: valor },
            { selector: 'span.stat-number', oldText: '+180', newText: '+' + valor }
        ],
        'partidos_jugados': [
            { selector: '.stat-label', oldText: '1000', newText: valor },
            { selector: 'span.stat-number', oldText: '+1000', newText: '+' + valor }
        ]
    };
    
    if (textUpdates[concepto]) {
        textUpdates[concepto].forEach(update => {
            const elementos = document.querySelectorAll(update.selector);
            elementos.forEach(el => {
                if (el.textContent.includes(update.oldText)) {
                    el.textContent = el.textContent.replace(update.oldText, update.newText);
                }
            });
        });
    }
}

// 🚀 INICIALIZACIÓN
// Ejecutar cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', actualizarDatosDinamicos);
} else {
    actualizarDatosDinamicos();
}

// 🔄 Opcional: Actualizar cada 5 minutos por si cambiás la planilla
setInterval(actualizarDatosDinamicos, 5 * 60 * 1000);

// 🎯 Exportar función para uso manual si es necesario
window.actualizarDatosDinamicos = actualizarDatosDinamicos;