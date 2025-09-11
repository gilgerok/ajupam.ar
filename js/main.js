/**
 * main.js - AJuPaM Web App
 * Version 2.0 - Con mejoras de UX, accesibilidad y performance
 */

/**
 * Sistema mejorado de tracking de eventos para Google Analytics 4
 * @param {string} eventName - El nombre del evento
 * @param {object} eventProps - Propiedades adicionales del evento
 */
function trackEvent(eventName, eventProps = {}) {
    // Log para debugging en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`📊 EVENTO: ${eventName}`, eventProps);
    }

    // Enviar a Google Analytics 4
    if (typeof gtag === 'function') {
        gtag('event', eventName, {
            ...eventProps,
            event_timestamp: Date.now(),
            page_url: window.location.href,
            page_title: document.title
        });
    }

    // Enviar a Facebook Pixel si está disponible
    if (typeof fbq === 'function') {
        fbq('trackCustom', eventName, eventProps);
    }

    // Enviar a dataLayer para GTM
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            event: eventName,
            ...eventProps
        });
    }
}

/**
 * Función para detectar el tipo de dispositivo
 * @returns {string} Tipo de dispositivo: 'mobile', 'tablet', o 'desktop'
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

/**
 * Función para obtener información de performance
 * @returns {object} Métricas de performance
 */
function getPerformanceMetrics() {
    if (!window.performance || !window.performance.timing) return {};

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    return {
        page_load_time: timing.loadEventEnd - navigationStart,
        dom_ready_time: timing.domContentLoadedEventEnd - navigationStart,
        first_paint: timing.responseStart - navigationStart,
        time_to_interactive: timing.domInteractive - navigationStart
    };
}

/**
 * Función optimizada para animación de contadores
 * @param {Element} counter - Elemento contador
 * @param {number} target - Valor objetivo
 * @param {number} duration - Duración de la animación
 */
function animateCounter(counter, target, duration = 1500) {
    if (counter.classList.contains('is-visible')) return;
    counter.classList.add('is-visible');

    const startTime = performance.now();
    const formatNumber = (num) => new Intl.NumberFormat('es-AR').format(Math.ceil(num));

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function para animación más suave
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const current = target * easedProgress;

        if (progress < 1) {
            counter.innerText = formatNumber(current);
            requestAnimationFrame(step);
        } else {
            counter.innerText = formatNumber(target);
            if (counter.dataset.prefix) {
                counter.innerText = counter.dataset.prefix + counter.innerText;
            }
        }
    }

    requestAnimationFrame(step);
}

/**
 * Lazy loading mejorado para imágenes
 */
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Si tiene data-src, usarlo
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }

                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

/**
 * CORRECCIÓN CRÍTICA: Manejo mejorado de formularios sin validación visual inicial
 * @param {HTMLFormElement} form - Elemento de formulario
 */
function handleFormSubmission(form) {
    // Limpiar cualquier estado previo de validación
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.classList.remove('error', 'valid', 'touched');
        const errorMsg = input.parentElement.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }
    });

    // Validación en tiempo real - Solo después de interacción
    inputs.forEach(input => {
        let hasInteracted = false;

        // Marcar como "touched" cuando el usuario sale del campo
        input.addEventListener('blur', function () {
            hasInteracted = true;
            this.classList.add('touched');
            validateField(this);
        });

        // Validar mientras escribe solo si ya interactuó
        input.addEventListener('input', function () {
            if (hasInteracted) {
                validateField(this);
            }
        });

        // Remover cualquier clase de validación al hacer focus
        input.addEventListener('focus', function () {
            if (!hasInteracted) {
                this.classList.remove('error', 'valid');
            }
        });
    });

    // Función de validación de campo individual
    function validateField(field) {
        const errorMsg = field.parentElement.querySelector('.error-message');

        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('error');
            field.classList.remove('valid');
            if (errorMsg) {
                errorMsg.textContent = 'Este campo es obligatorio';
                errorMsg.style.display = 'block';
            }
            return false;
        }

        if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                field.classList.add('error');
                field.classList.remove('valid');
                if (errorMsg) {
                    errorMsg.textContent = 'Por favor, ingresá un email válido';
                    errorMsg.style.display = 'block';
                }
                return false;
            }
        }

        if (field.type === 'tel' && field.value.trim()) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(field.value) || field.value.replace(/\D/g, '').length < 8) {
                field.classList.add('error');
                field.classList.remove('valid');
                if (errorMsg) {
                    errorMsg.textContent = 'Por favor, ingresá un teléfono válido';
                    errorMsg.style.display = 'block';
                }
                return false;
            }
        }

        // Si pasa la validación
        if (field.value.trim()) {
            field.classList.remove('error');
            field.classList.add('valid');
            if (errorMsg) {
                errorMsg.textContent = '';
                errorMsg.style.display = 'none';
            }
        }

        return true;
    }

    // Manejo del envío del formulario
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const formButton = this.querySelector('button[type="submit"]');
        const originalButtonHTML = formButton.innerHTML;
        const formType = this.closest('[data-form-type]')?.dataset?.formType || 'contact';

        // Validar todos los campos antes de enviar
        let isValid = true;
        inputs.forEach(input => {
            input.classList.add('touched');
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            // Hacer scroll al primer campo con error
            const firstError = this.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Anunciar error a lectores de pantalla
            announceToScreenReader('Por favor, corregí los errores en el formulario antes de enviarlo');

            trackEvent('form_validation_error', {
                form_type: formType,
                device_type: getDeviceType()
            });

            return;
        }

        // Estado de loading
        formButton.innerHTML = '<span class="loading-spinner"></span> Enviando...';
        formButton.disabled = true;
        this.classList.add('loading');

        try {
            // Tracking del intento de envío
            trackEvent('form_submit_attempt', {
                form_type: formType,
                form_fields: Array.from(formData.keys()),
                device_type: getDeviceType()
            });

            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Éxito
                this.parentElement.innerHTML = `
                    <div class="form-feedback-success" role="alert">
                        <h3>¡Gracias por tu interés!</h3>
                        <p>Tu solicitud ha sido enviada exitosamente. Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24-48 horas hábiles.</p>
                        <div class="success-animation">✓</div>
                    </div>
                `;

                // Anunciar éxito a lectores de pantalla
                announceToScreenReader('Formulario enviado exitosamente');

                trackEvent('form_submit_success', {
                    form_type: formType,
                    response_time: performance.now(),
                    device_type: getDeviceType()
                });

            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            console.error('Error en envío de formulario:', error);

            // Mostrar error al usuario
            const errorMsg = `
                <div class="error-state" role="alert">
                    <strong>Hubo un problema al enviar tu solicitud.</strong><br>
                    Por favor, intenta nuevamente o contáctanos directamente por WhatsApp al +54 9 261 253-4840.
                </div>
            `;

            const existingError = this.querySelector('.error-state');
            if (existingError) existingError.remove();

            this.insertAdjacentHTML('beforeend', errorMsg);

            // Restaurar estado del botón
            formButton.innerHTML = originalButtonHTML;
            formButton.disabled = false;
            this.classList.remove('loading');

            // Anunciar error a lectores de pantalla
            announceToScreenReader('Error al enviar el formulario. Por favor, intenta nuevamente');

            trackEvent('form_submit_error', {
                form_type: formType,
                error_message: error.message,
                device_type: getDeviceType()
            });
        }
    });
}

/**
 * Función para anunciar mensajes a lectores de pantalla
 * @param {string} message - Mensaje a anunciar
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Mejorar la accesibilidad del sitio
 */
function enhanceAccessibility() {
    // Agregar skip link si no existe
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Saltar al contenido principal';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Mejorar navegación por teclado
    document.addEventListener('keydown', (e) => {
        // Esc cierra el menú móvil si está abierto
        if (e.key === 'Escape') {
            const navMenu = document.querySelector('.nav-menu.active');
            if (navMenu) {
                window.closeMenu?.();
            }
        }

        // Tab trap para el menú móvil cuando está abierto
        if (e.key === 'Tab') {
            const navMenu = document.querySelector('.nav-menu.active');
            if (navMenu) {
                const focusableElements = navMenu.querySelectorAll(
                    'a[href], button, [tabindex]:not([tabindex="-1"])'
                );
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

/**
 * Monitorear el rendimiento de la página
 */
function monitorPerformance() {
    // Web Vitals
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];

                trackEvent('web_vital_lcp', {
                    value: Math.round(lastEntry.startTime),
                    rating: lastEntry.startTime < 2500 ? 'good' :
                        lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
                });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('LCP observer not supported');
        }

        // First Input Delay
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const firstInput = list.getEntries()[0];
                const delay = firstInput.processingStart - firstInput.startTime;

                trackEvent('web_vital_fid', {
                    value: Math.round(delay),
                    rating: delay < 100 ? 'good' : delay < 300 ? 'needs_improvement' : 'poor'
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID observer not supported');
        }

        // Cumulative Layout Shift
        let clsValue = 0;
        let clsEntries = [];

        try {
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        clsEntries.push(entry);
                    }
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // Reportar CLS cuando la página se va a cerrar
            window.addEventListener('beforeunload', () => {
                trackEvent('web_vital_cls', {
                    value: clsValue,
                    rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor'
                });
            });
        } catch (e) {
            console.warn('CLS observer not supported');
        }
    }

    // Tiempo de carga total
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = getPerformanceMetrics();
            trackEvent('page_performance', {
                ...perfData,
                device_type: getDeviceType(),
                connection_type: navigator.connection?.effectiveType || 'unknown',
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            });
        }, 0);
    });
}

/**
 * Inicialización del menú hamburguesa mejorado
 */
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (!hamburger || !navMenu) return;

    const closeMenu = () => {
        navMenu.classList.remove('active');
        hamburger.querySelector('i').classList.replace('fa-times', 'fa-bars');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Abrir menú de navegación');
        document.body.style.overflow = '';
    };

    const openMenu = () => {
        navMenu.classList.add('active');
        hamburger.querySelector('i').classList.replace('fa-bars', 'fa-times');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Cerrar menú de navegación');
        document.body.style.overflow = 'hidden';

        // Focus en el primer elemento del menú
        setTimeout(() => {
            const firstLink = navMenu.querySelector('a');
            if (firstLink) firstLink.focus();
        }, 300);
    };

    hamburger.addEventListener('click', () => {
        const isActive = navMenu.classList.contains('active');

        if (isActive) {
            closeMenu();
            trackEvent('mobile_menu_close', { method: 'hamburger_click' });
        } else {
            openMenu();
            trackEvent('mobile_menu_open', { method: 'hamburger_click' });
        }
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            closeMenu();
            trackEvent('mobile_menu_close', { method: 'outside_click' });
        }
    });

    // Cerrar menú con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
            hamburger.focus();
            trackEvent('mobile_menu_close', { method: 'escape_key' });
        }
    });

    // Exponer función globalmente
    window.closeMenu = closeMenu;
}

/**
 * Inicialización del carrusel
 */
function initCarousel() {
    // Carrusel general de momentos
    const splideElement = document.querySelector('#momentos-ajupam .splide');
    if (splideElement && typeof Splide !== 'undefined') {
        const splide = new Splide(splideElement, {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            autoplay: true,
            interval: 4000,
            pauseOnHover: true,
            pauseOnFocus: true,
            gap: '20px',
            pagination: false,
            arrows: true,
            keyboard: true,
            reducedMotion: {
                autoplay: false,
                speed: 0
            },
            accessibility: {
                liveRegion: true,
                label: 'Galería de imágenes de la comunidad AJuPaM'
            },
            breakpoints: {
                768: {
                    perPage: 1,
                    arrows: false,
                    pagination: true
                },
                1024: {
                    perPage: 2
                }
            }
        });

        splide.on('moved', (newIndex) => {
            trackEvent('carousel_slide_change', {
                slide_index: newIndex,
                total_slides: splide.length,
                carousel_id: 'momentos-ajupam'
            });
        });

        splide.mount();
    }

    // Configuración específica para galería de premiadores
    const galeriaElement = document.querySelector('#galeria .splide, #galeria-splide');
    if (galeriaElement && typeof Splide !== 'undefined') {
        const galeriaSplide = new Splide(galeriaElement, {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            autoplay: true,
            interval: 3000,
            pauseOnHover: true,
            pauseOnFocus: true,
            gap: '30px',
            padding: '20px',
            pagination: false,
            arrows: true,
            lazyLoad: 'nearby',
            preloadPages: 1,
            keyboard: true,
            reducedMotion: {
                autoplay: false,
                speed: 0
            },
            accessibility: {
                liveRegion: true,
                label: 'Galería de premiaciones AJuPaM'
            },
            breakpoints: {
                480: {
                    perPage: 1,
                    gap: '15px',
                    padding: '10px',
                    arrows: false
                },
                768: {
                    perPage: 2,
                    gap: '20px',
                    arrows: false
                },
                1024: {
                    perPage: 3
                }
            }
        });

        // Tracking para galería de premiadores
        galeriaSplide.on('moved', (newIndex) => {
            trackEvent('gallery_slide_change', {
                slide_index: newIndex,
                total_slides: galeriaSplide.length,
                carousel_id: 'galeria-premiadores'
            });
        });

        // Manejo de errores de imágenes en la galería
        const galleryImages = galeriaElement.querySelectorAll('img');
        galleryImages.forEach(img => {
            img.addEventListener('error', function () {
                // Usar placeholder si la imagen falla
                this.src = 'https://via.placeholder.com/600x600/cccccc/666666?text=Imagen+No+Disponible';
                this.alt = 'Imagen temporalmente no disponible';

                // Tracking del error
                trackEvent('image_load_error', {
                    original_src: this.getAttribute('src'),
                    alt_text: this.getAttribute('alt'),
                    section: 'galeria-premiadores'
                });
            });

            // Añadir loaded class cuando carga exitosamente
            img.addEventListener('load', function () {
                this.classList.add('loaded');
            });
        });

        galeriaSplide.mount();

        console.log('✅ Galería de premiadores inicializada correctamente');
    }

    // Configuración específica para otros carruseles si existen
    const allSplides = document.querySelectorAll('.splide:not(#momentos-ajupam .splide):not(#galeria .splide):not(#galeria-splide)');
    allSplides.forEach((element, index) => {
        if (typeof Splide !== 'undefined') {
            const genericSplide = new Splide(element, {
                type: 'loop',
                perPage: 1,
                autoplay: true,
                interval: 4000,
                pauseOnHover: true,
                pauseOnFocus: true,
                pagination: true,
                arrows: true,
                keyboard: true
            });

            genericSplide.mount();
            console.log(`✅ Carrusel genérico ${index + 1} inicializado`);
        }
    });
}

/**
 * Tracking de interacciones específicas
 */
function setupEventTracking() {
    // Tracking de descargas de PDF
    document.querySelectorAll('.btn-pdf').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileName = e.currentTarget.getAttribute('download') || 'dossier.pdf';
            const section = e.currentTarget.closest('section')?.id || 'unknown';

            trackEvent('dossier_download', {
                file_name: fileName,
                download_location: section,
                page_type: window.location.pathname.includes('proveedores') ? 'proveedores' : 'economicos'
            });
        });
    });

    // Tracking de clicks en WhatsApp
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', (e) => {
            let location = 'unknown';

            if (link.classList.contains('whatsapp-float')) {
                location = 'float_button';
            } else if (link.closest('.hero-buttons')) {
                location = 'hero_cta';
            } else if (link.closest('.contact-direct')) {
                location = 'contact_section';
            } else {
                location = 'inline_link';
            }

            trackEvent('whatsapp_click', {
                location: location,
                section: link.closest('section')?.id || 'unknown',
                device_type: getDeviceType()
            });
        });
    });

    // Tracking de clicks en cards de sponsors
    document.querySelectorAll('.sponsor-card').forEach(card => {
        const cardTitle = card.querySelector('h3')?.textContent || 'unknown';

        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                trackEvent('sponsor_card_cta_click', {
                    card_title: cardTitle,
                    is_recommended: card.classList.contains('recommended')
                });
            }
        });
    });

    // Tracking de scroll depth
    let maxScrollDepth = 0;
    const scrollMilestones = [25, 50, 75, 90, 100];
    const reachedMilestones = new Set();

    const throttledScroll = throttle(() => {
        const scrollDepth = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;

            scrollMilestones.forEach(milestone => {
                if (scrollDepth >= milestone && !reachedMilestones.has(milestone)) {
                    reachedMilestones.add(milestone);

                    trackEvent('scroll_depth', {
                        depth_percentage: milestone,
                        time_on_page: Math.round((Date.now() - window.pageLoadTime) / 1000)
                    });
                }
            });
        }
    }, 250);

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Tracking de tiempo en página
    let timeSpentIntervals = [30, 60, 120, 300]; // segundos
    let currentInterval = 0;

    const timeTracker = setInterval(() => {
        const timeSpent = Math.floor((Date.now() - window.pageLoadTime) / 1000);

        if (currentInterval < timeSpentIntervals.length &&
            timeSpent >= timeSpentIntervals[currentInterval]) {

            trackEvent('time_on_page', {
                seconds: timeSpentIntervals[currentInterval],
                engagement_level: currentInterval < 2 ? 'low' : currentInterval < 3 ? 'medium' : 'high'
            });

            currentInterval++;
        }

        if (currentInterval >= timeSpentIntervals.length) {
            clearInterval(timeTracker);
        }
    }, 10000);

    // Cleanup al salir
    window.addEventListener('beforeunload', () => {
        clearInterval(timeTracker);
    });
}

/**
 * Función throttle para optimizar eventos frecuentes
 */
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Inicialización principal
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando AJuPaM Web App v2.0...');

    // Guardar tiempo de carga de la página
    window.pageLoadTime = Date.now();

    try {
        // Inicializar AOS con configuración optimizada
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 700,
                once: true,
                offset: 50,
                disable: window.innerWidth < 768 ? true : false,
                easing: 'ease-out-cubic'
            });
        }

        // Setup lazy loading
        setupLazyLoading();

        // Imagenes erróneas o inexistentes
        setupImageFallbacks();

        // Mejorar accesibilidad
        enhanceAccessibility();

        // Monitorear rendimiento
        monitorPerformance();

        // Inicializar menú móvil
        initMobileMenu();

        // Inicializar carrusel
        setTimeout(initCarousel, 100);

        // Navegación suave
        document.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) return;

                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });

                    // Cerrar menú móvil si está abierto
                    if (window.closeMenu) {
                        const navMenu = document.querySelector('.nav-menu.active');
                        if (navMenu) window.closeMenu();
                    }

                    trackEvent('internal_navigation', {
                        from_section: window.location.hash || 'top',
                        to_section: targetId
                    });
                }
            });
        });

        // Observador para contadores animados
        const countersObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const targetAttr = counter.getAttribute('data-target');
                    if (targetAttr !== null && !counter.classList.contains('is-visible')) {
                        const target = parseInt(targetAttr, 10);
                        animateCounter(counter, target);
                    }
                });
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -100px 0px'
        });

        // Observar todas las secciones con contadores
        document.querySelectorAll('section').forEach(section => {
            if (section.querySelector('.stat-number')) {
                countersObserver.observe(section);
            }
        });

        // Gestión de formularios con validación corregida
        const contactForms = document.querySelectorAll('.contacto-form form, form[action*="formspree"]');
        contactForms.forEach(form => {
            handleFormSubmission(form);
        });

        // Setup tracking de eventos
        setupEventTracking();

        // Actualizar año de copyright
        const copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) {
            copyrightYear.textContent = new Date().getFullYear();
        }

        // Tracking de inicialización exitosa
        trackEvent('app_initialized', {
            page_type: window.location.pathname.includes('proveedores') ? 'proveedores' : 'economicos',
            device_type: getDeviceType(),
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            has_aos: typeof AOS !== 'undefined',
            has_splide: typeof Splide !== 'undefined',
            version: '2.0'
        });

        console.log('✅ AJuPaM Web App v2.0 inicializada correctamente');

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);

        trackEvent('app_initialization_error', {
            error_message: error.message,
            error_stack: error.stack
        });
    }
    function setupImageFallbacks() {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Skip si ya tiene un listener
            if (img.dataset.fallbackSet) return;

            img.dataset.fallbackSet = 'true';

            img.addEventListener('error', function () {
                // No aplicar fallback si ya es un placeholder
                if (this.src.includes('placeholder.com')) return;

                // Determinar el tipo de placeholder basado en el contexto
                let placeholderUrl = 'https://via.placeholder.com/400x400/f5f5f5/999999?text=Imagen+No+Disponible';

                if (this.closest('.premiador-logo-item')) {
                    placeholderUrl = 'https://via.placeholder.com/140x70/ffffff/035aa6?text=Logo';
                } else if (this.closest('#galeria')) {
                    placeholderUrl = 'https://via.placeholder.com/600x600/035aa6/ffffff?text=Galería';
                } else if (this.closest('.sponsor-logo-item')) {
                    placeholderUrl = 'https://via.placeholder.com/170x80/ffffff/035aa6?text=Sponsor';
                }

                this.src = placeholderUrl;
                this.alt = 'Imagen temporalmente no disponible';

                console.warn(`⚠️ Imagen no encontrada: ${this.getAttribute('src')}. Usando placeholder.`);
            });
        });
    }
});

// Exponer funciones globales útiles
window.trackEvent = trackEvent;
window.getDeviceType = getDeviceType;
window.announceToScreenReader = announceToScreenReader;