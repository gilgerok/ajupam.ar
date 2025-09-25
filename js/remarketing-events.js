/**
 * remarketing-events.js - Tracking centralizado (GA4 + Meta Pixel)
 * AJuPaM 2025
 */

/**
 * Función central de tracking
 * Envía a Google Analytics 4 y Meta Pixel
 */
function trackEvent(eventName, eventProps = {}) {
    // Log para debugging en localhost
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

    // Enviar a Meta Pixel
    if (typeof fbq === 'function') {
        fbq('trackCustom', eventName, eventProps);
    }
}

/* ============================================================
   EVENTOS ESPECÍFICOS DE LA WEB
   ============================================================ */

/**
 * Eventos de remarketing (liga, ranking, sponsors, contacto)
 */
function setupRemarketingEvents() {
    // --- La Liga AJuPaM ---
    const ligaBtn = document.querySelector('a[href="#la-liga"]');
    if (ligaBtn) {
        ligaBtn.addEventListener('click', () => {
            trackEvent('project_interest', {
                project_name: 'liga_ajupam',
                action_type: 'view_more',
                interest_level: 'high'
            });
            fbq?.('track', 'ViewContent', { content_name: 'Liga AJuPaM' });
        });
    }

    // --- Ranking Unificado ---
    const rankingBtn = document.querySelector('a[href*="rankingajupam"]');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            trackEvent('project_interest', {
                project_name: 'ranking_unificado',
                action_type: 'external_visit',
                interest_level: 'medium'
            });
            fbq?.('track', 'ViewContent', { content_name: 'Ranking Unificado' });
        });
    }

    // --- Registrar Club ---
    const clubBtn = document.querySelector('a[data-link="link_registrar_club"]');
    if (clubBtn) {
        clubBtn.addEventListener('click', () => {
            trackEvent('conversion_intent', {
                intent_type: 'register_club',
                user_role: 'club_owner',
                conversion_value: 'high'
            });
            fbq?.('track', 'Lead', { intent: 'register_club' });
        });
    }

    // --- Sumarse como jugador ---
    document.querySelectorAll('a[data-link="link_sumarse_jugador"]').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('conversion_intent', {
                intent_type: 'join_as_player',
                user_role: 'player',
                conversion_value: 'very_high'
            });
            fbq?.('track', 'CompleteRegistration', { role: 'player' });
        });
    });

    // --- Toggle categorías de Liga ---
    const ligaToggle = document.querySelector('.btn-liga-toggle');
    if (ligaToggle) {
        ligaToggle.addEventListener('click', () => {
            trackEvent('liga_interaction', { action: 'open_categories' });
            fbq?.('trackCustom', 'OpenLigaCategories');
        });
    }

    // --- Click en categorías ---
    document.querySelectorAll('.btn-submenu[data-liga]').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoria = btn.dataset.liga;
            trackEvent('liga_category_view', { category: categoria, action: 'open_modal' });
            fbq?.('track', 'ViewContent', { content_name: `Liga ${categoria}` });
        });
    });

    // --- Inscripción Liga ---
    const inscripcionBtn = document.querySelector('.btn-inscripcion');
    if (inscripcionBtn) {
        inscripcionBtn.addEventListener('click', () => {
            trackEvent('liga_signup_intent', { action: 'inscription_click' });
            fbq?.('track', 'Lead', { form: 'liga_signup' });
        });
    }

    // --- Links en modal de Liga ---
    document.querySelectorAll('.liga-link').forEach(link => {
        link.addEventListener('click', () => {
            const category = link.querySelector('span')?.textContent || 'unknown';
            trackEvent('liga_spreadsheet_view', { category, user_intent: 'checking_standings' });
            fbq?.('trackCustom', 'CheckStandings', { category });
        });
    });

    // --- Sponsors ---
    document.querySelectorAll('.sponsor-type-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const sponsorType = card.querySelector('h3')?.textContent || 'unknown';
            const href = card.getAttribute('href');

            trackEvent('sponsor_interest', {
                sponsor_type: sponsorType.toLowerCase().replace(/\s+/g, '_')
            });
            fbq?.('track', 'Lead', { sponsor_type: sponsorType });

            setTimeout(() => { window.location.href = href; }, 100);
        });
    });

    // --- Contacto ---
    const contactoSection = document.getElementById('contacto');
    if (contactoSection) {
        contactoSection.addEventListener('click', () => {
            trackEvent('contact_section_click', { section: 'contacto' });
            fbq?.('track', 'Contact');
        });
    }
}

/**
 * Tracking de performance
 */
function setupPerformanceTracking() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.getPerformanceMetrics?.() || {};
            trackEvent('page_performance', {
                ...perfData,
                device_type: window.getDeviceType?.(),
                connection_type: navigator.connection?.effectiveType || 'unknown',
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            });
        }, 0);
    });
}

/**
 * Tracking de formularios
 */
function setupFormTracking() {
    document.addEventListener('form_validation_error', e => {
        trackEvent('form_validation_error', e.detail || {});
    });

    document.addEventListener('form_submit_attempt', e => {
        trackEvent('form_submit_attempt', e.detail || {});
    });

    document.addEventListener('form_submit_success', e => {
        trackEvent('form_submit_success', e.detail || {});
    });

    document.addEventListener('form_submit_error', e => {
        trackEvent('form_submit_error', e.detail || {});
    });
}

/**
 * Tracking de navegación y menú
 */
function setupNavigationTracking() {
    document.addEventListener('internal_navigation', e => {
        trackEvent('internal_navigation', e.detail || {});
    });

    document.addEventListener('mobile_menu_open', e => {
        trackEvent('mobile_menu_open', e.detail || {});
    });

    document.addEventListener('mobile_menu_close', e => {
        trackEvent('mobile_menu_close', e.detail || {});
    });
}

/**
 * Tracking de carruseles y galerías
 */
function setupCarouselTracking() {
    document.addEventListener('carousel_slide_change', e => {
        trackEvent('carousel_slide_change', e.detail || {});
    });

    document.addEventListener('gallery_slide_change', e => {
        trackEvent('gallery_slide_change', e.detail || {});
    });

    document.addEventListener('image_load_error', e => {
        trackEvent('image_load_error', e.detail || {});
    });
}

/**
 * Tracking de scroll depth y tiempo en página
 */
function setupEngagementTracking() {
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

    // Tiempo en página
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

    window.addEventListener('beforeunload', () => {
        clearInterval(timeTracker);
    });
}

/**
 * Tracking de inicialización
 */
function setupAppTracking() {
    try {
        trackEvent('app_initialized', {
            page_type: window.location.pathname.includes('proveedores') ? 'proveedores' :
                window.location.pathname.includes('premiadores') ? 'premiadores' : 'economicos',
            device_type: window.getDeviceType?.(),
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            has_aos: typeof AOS !== 'undefined',
            has_splide: typeof Splide !== 'undefined',
            version: '2.1'
        });
    } catch (error) {
        trackEvent('app_initialization_error', {
            error_message: error.message,
            error_stack: error.stack
        });
    }
}

/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Throttle para limitar ejecución de funciones
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
    };
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
    setupRemarketingEvents();
    setupPerformanceTracking();
    setupFormTracking();
    setupNavigationTracking();
    setupCarouselTracking();
    setupEngagementTracking();
    setupAppTracking();
});

// Exponer globalmente
window.trackEvent = trackEvent;
