/*!
 * AJuPaM Home - JavaScript específico para index.html
 * Extiende /js/main.js sin interferir con páginas existentes
 * Version: 1.0.0
 */

// Esperar a que main.js se cargue completamente
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que no estamos en una página de sponsors
    if (window.location.pathname.includes('/sponsors/')) {
        return; // No ejecutar este script en páginas de sponsors
    }
    
    console.log('🏠 Inicializando AJuPaM Home...');
    
    // ===== INICIALIZACIÓN DEL HOME =====
    initHomeAOS();
    initHomeCounters();
    initHomeScrollEffects();
    initHomeInteractions();
    
    console.log('✅ AJuPaM Home inicializado correctamente');
});

// ===== AOS ESPECÍFICO DEL HOME =====
function initHomeAOS() {
    // Solo inicializar si AOS no está ya inicializado por main.js
    if (typeof AOS !== 'undefined' && !window.aosInitialized) {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100,
            delay: 50
        });
        window.aosInitialized = true;
        console.log('🎬 AOS inicializado para Home');
    }
}

// ===== CONTADORES ANIMADOS =====
function initHomeCounters() {
    const counters = document.querySelectorAll('.counter');
    
    if (counters.length === 0) return;
    
    // Configuración específica para contadores del home
    const homeCounterConfig = {
        duration: 2000,
        delay: 1000, // Delay adicional para el home
        formatters: {
            2000: (val) => val >= 2000 ? '2000+' : val.toString(),
            53: (val) => val.toString(),
            9: (val) => val.toString(),
            287000: (val) => {
                if (val >= 1000) {
                    return Math.floor(val / 1000) + 'K+';
                }
                return val.toString();
            },
            23000: (val) => {
                if (val >= 1000) {
                    return Math.floor(val / 1000) + 'K+';
                }
                return val.toString();
            },
            944: (val) => val.toString(),
            700: (val) => val.toString() + '+'
        }
    };
    
    // Intersection Observer para activar contadores
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateHomeCounter(entry.target, homeCounterConfig);
                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateHomeCounter(element, config) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = config.duration;
    const startDelay = config.delay;
    
    // Agregar clase de animación
    element.classList.add('animate');
    
    // Delay antes de comenzar
    setTimeout(() => {
        const startTime = performance.now();
        const startValue = 0;
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
            
            // Aplicar formatter si existe
            const formatter = config.formatters[target];
            if (formatter) {
                element.textContent = formatter(currentValue);
            } else {
                element.textContent = currentValue.toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Valor final
                element.textContent = formatter ? formatter(target) : target.toLocaleString();
                
                // Tracking del evento
                if (typeof trackEvent === 'function') {
                    trackEvent('home_counter_completed', {
                        counter_target: target,
                        counter_element: element.closest('.hero-stat, .community-stat')?.querySelector('.stat-label, .stat-desc')?.textContent || 'unknown'
                    });
                }
            }
        }
        
        requestAnimationFrame(updateCounter);
    }, startDelay);
}

// ===== EFECTOS DE SCROLL ESPECÍFICOS =====
function initHomeScrollEffects() {
    // Parallax sutil para el hero
    const heroBackground = document.querySelector('.hero-home .hero-background');
    
    if (heroBackground) {
        let ticking = false;
        
        function updateParallax() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (heroBackground) {
                heroBackground.style.transform = `translate3d(0, ${rate}px, 0)`;
            }
            
            ticking = false;
        }
        
        function requestParallaxTick() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestParallaxTick, { passive: true });
    }
    
    // Efecto de fade para hero stats
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.2 });
        
        heroStats.style.opacity = '0';
        heroStats.style.transform = 'translateY(30px)';
        heroStats.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        statsObserver.observe(heroStats);
    }
}

// ===== INTERACCIONES ESPECÍFICAS DEL HOME =====
function initHomeInteractions() {
    // Tracking de clics en CTAs principales
    const primaryCTAs = document.querySelectorAll('.hero-buttons .btn-primary');
    primaryCTAs.forEach((cta, index) => {
        cta.addEventListener('click', () => {
            if (typeof trackEvent === 'function') {
                trackEvent('home_primary_cta_click', {
                    cta_text: cta.textContent.trim(),
                    cta_position: index + 1,
                    cta_href: cta.href
                });
            }
        });
    });
    
    // Tracking de clics en proyectos
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Solo si no es un link directo
            if (!e.target.closest('a')) {
                const projectName = card.querySelector('h3')?.textContent.trim();
                if (typeof trackEvent === 'function') {
                    trackEvent('home_project_card_click', {
                        project_name: projectName || 'unknown'
                    });
                }
            }
        });
    });
    
    // Tracking de clics en stats de comunidad
    const communityStats = document.querySelectorAll('.community-stat');
    communityStats.forEach(stat => {
        stat.addEventListener('click', () => {
            const statLabel = stat.querySelector('.stat-desc')?.textContent.trim();
            if (typeof trackEvent === 'function') {
                trackEvent('home_community_stat_click', {
                    stat_label: statLabel || 'unknown'
                });
            }
        });
    });
    
    // Mejorar accesibilidad de navegación suave
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 80;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Foco para accesibilidad
                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus();
                
                if (typeof trackEvent === 'function') {
                    trackEvent('home_internal_navigation', {
                        target_section: targetId,
                        link_text: link.textContent.trim()
                    });
                }
            }
        });
    });
    
    // Efecto hover mejorado para value items
    const valueItems = document.querySelectorAll('.value-item');
    valueItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Timeline items interactivos
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remover active de todos
            timelineItems.forEach(ti => ti.classList.remove('active'));
            // Agregar active al clickeado
            item.classList.add('active');
            
            if (typeof trackEvent === 'function') {
                const editionText = item.querySelector('h4')?.textContent.trim();
                trackEvent('home_timeline_click', {
                    edition: editionText || `item_${index + 1}`,
                    position: index + 1
                });
            }
        });
    });
}

// ===== UTILIDADES ESPECÍFICAS DEL HOME =====
const HomeUtils = {
    // Función para hacer scroll suave a una sección
    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.main-header')?.offsetHeight || 80;
            const targetPosition = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    // Función para obtener estadísticas de scroll
    getScrollStats() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        
        return {
            scrollTop,
            docHeight,
            scrollPercent,
            viewportHeight: window.innerHeight
        };
    },
    
    // Función para detectar la sección visible actual
    getCurrentSection() {
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = document.querySelector('.main-header')?.offsetHeight || 80;
        
        for (let section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= headerHeight + 50 && rect.bottom >= headerHeight + 50) {
                return section.id;
            }
        }
        
        return null;
    }
};

// ===== TRACKING ESPECÍFICO DEL HOME =====
if (typeof trackEvent === 'function') {
    // Tracking de tiempo en secciones
    let sectionTimers = {};
    let currentSection = null;
    
    function trackSectionTime() {
        const newSection = HomeUtils.getCurrentSection();
        
        if (newSection !== currentSection) {
            // Finalizar timer de sección anterior
            if (currentSection && sectionTimers[currentSection]) {
                const timeSpent = Date.now() - sectionTimers[currentSection];
                trackEvent('home_section_time', {
                    section: currentSection,
                    time_spent: Math.round(timeSpent / 1000) // en segundos
                });
            }
            
            // Iniciar timer de nueva sección
            if (newSection) {
                sectionTimers[newSection] = Date.now();
                trackEvent('home_section_enter', {
                    section: newSection
                });
            }
            
            currentSection = newSection;
        }
    }
    
    // Ejecutar tracking cada 2 segundos
    setInterval(trackSectionTime, 2000);
    
    // Tracking de salida de página
    window.addEventListener('beforeunload', () => {
        if (currentSection && sectionTimers[currentSection]) {
            const timeSpent = Date.now() - sectionTimers[currentSection];
            trackEvent('home_section_time', {
                section: currentSection,
                time_spent: Math.round(timeSpent / 1000)
            });
        }
        
        const scrollStats = HomeUtils.getScrollStats();
        trackEvent('home_page_exit', {
            max_scroll: scrollStats.scrollPercent,
            final_section: currentSection
        });
    });
}

// ===== COMPATIBILIDAD CON MAIN.JS =====
// Verificar que las funciones de main.js estén disponibles
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco más para asegurar que main.js se haya cargado
    setTimeout(() => {
        // Si main.js no está disponible, inicializar funciones básicas
        if (typeof window.closeMenu !== 'function') {
            console.warn('⚠️ main.js no detectado, inicializando funciones básicas...');
            initBasicNavigation();
        }
    }, 500);
});

function initBasicNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = navMenu.classList.contains('active');
            
            if (isActive) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                navMenu.classList.add('active');
                hamburger.classList.add('active');
                hamburger.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Cerrar menú al hacer clic en links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }
}

// ===== EXPORTAR UTILIDADES PARA DEBUGGING =====
if (typeof window !== 'undefined') {
    window.AJuPaMHome = {
        utils: HomeUtils,
        scrollToSection: HomeUtils.scrollToSection,
        getCurrentSection: HomeUtils.getCurrentSection,
        getScrollStats: HomeUtils.getScrollStats
    };
}

// ===== OPTIMIZACIÓN DE PERFORMANCE =====
// Throttle para eventos de scroll
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Aplicar throttling a eventos de scroll
const throttledScrollHandler = throttle(() => {
    // Aquí se pueden agregar más efectos de scroll si es necesario
}, 16); // 60fps

window.addEventListener('scroll', throttledScrollHandler, { passive: true });

console.log('📱 AJuPaM Home JS cargado completamente');