/**
 * mobile-enhancements.js - Mejoras de JavaScript para Mobile
 * AJuPaM - Agrupación de Jugadores de Pádel de Mendoza
 * Version: 2.0
 * 
 * Este archivo mejora la experiencia mobile con:
 * - Detección mejorada de dispositivos móviles
 * - Menú mobile optimizado
 * - Touch events mejorados
 * - Viewport fixes para iOS
 * - Lazy loading optimizado
 * - Smooth scrolling mejorado
 */

(function() {
    'use strict';

    /**
     * Utilidades Mobile
     */
    const MobileUtils = {
        /**
         * Detecta si es un dispositivo móvil
         */
        isMobile() {
            return window.innerWidth <= 768 || 'ontouchstart' in window;
        },

        /**
         * Detecta si es iOS
         */
        isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        },

        /**
         * Detecta si es Android
         */
        isAndroid() {
            return /Android/.test(navigator.userAgent);
        },

        /**
         * Obtiene la altura real del viewport
         */
        getViewportHeight() {
            return window.innerHeight || document.documentElement.clientHeight;
        },

        /**
         * Previene el zoom en inputs en iOS
         */
        preventIOSZoom() {
            if (this.isIOS()) {
                const metaViewport = document.querySelector('meta[name="viewport"]');
                if (metaViewport) {
                    metaViewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                    );
                }
            }
        }
    };

    /**
     * Menú Mobile Mejorado
     */
    class MobileMenu {
        constructor() {
            this.hamburger = document.querySelector('.hamburger-btn');
            this.navMenu = document.querySelector('.nav-menu');
            this.navLinks = document.querySelectorAll('.nav-menu a');
            this.body = document.body;
            this.isOpen = false;
            
            this.init();
        }

        init() {
            if (!this.hamburger || !this.navMenu) return;

            // Toggle menú
            this.hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            // Cerrar al hacer click en un link
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isOpen) {
                        this.close();
                    }
                });
            });

            // Cerrar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.navMenu.contains(e.target)) {
                    this.close();
                }
            });

            // Prevenir scroll cuando el menú está abierto
            this.navMenu.addEventListener('touchmove', (e) => {
                if (this.isOpen) {
                    e.preventDefault();
                }
            }, { passive: false });

            // Cerrar con tecla ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        toggle() {
            this.isOpen ? this.close() : this.open();
        }

        open() {
            this.isOpen = true;
            this.navMenu.classList.add('active');
            this.hamburger.classList.add('active');
            this.body.style.overflow = 'hidden';
            this.hamburger.setAttribute('aria-expanded', 'true');
            
            // Animar ícono hamburguesa
            this.animateHamburger(true);
        }

        close() {
            this.isOpen = false;
            this.navMenu.classList.remove('active');
            this.hamburger.classList.remove('active');
            this.body.style.overflow = '';
            this.hamburger.setAttribute('aria-expanded', 'false');
            
            // Animar ícono hamburguesa
            this.animateHamburger(false);
        }

        animateHamburger(isOpen) {
            const icon = this.hamburger.querySelector('i');
            if (icon) {
                icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
            }
        }
    }

    /**
     * Touch Events Mejorados
     */
    class TouchHandler {
        constructor() {
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            
            this.init();
        }

        init() {
            // Mejorar respuesta táctil en botones y links
            this.improveButtonResponse();
            
            // Swipe para cerrar menú
            this.handleMenuSwipe();
            
            // Mejorar scroll en iOS
            this.improveIOSScroll();
        }

        improveButtonResponse() {
            const interactiveElements = document.querySelectorAll('a, button, .btn, [role="button"]');
            
            interactiveElements.forEach(element => {
                // Agregar feedback táctil
                element.addEventListener('touchstart', function() {
                    this.style.opacity = '0.7';
                }, { passive: true });
                
                element.addEventListener('touchend', function() {
                    setTimeout(() => {
                        this.style.opacity = '';
                    }, 100);
                }, { passive: true });
                
                // Prevenir delay de 300ms en clicks
                element.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    this.click();
                }, { passive: false });
            });
        }

        handleMenuSwipe() {
            const navMenu = document.querySelector('.nav-menu');
            if (!navMenu) return;

            navMenu.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            navMenu.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
        }

        handleSwipe() {
            const swipeDistance = this.touchEndX - this.touchStartX;
            const navMenu = document.querySelector('.nav-menu');
            
            // Swipe right para cerrar menú (solo si está abierto)
            if (swipeDistance > 100 && navMenu.classList.contains('active')) {
                const menu = new MobileMenu();
                menu.close();
            }
        }

        improveIOSScroll() {
            if (MobileUtils.isIOS()) {
                document.querySelectorAll('.scrollable, .modal-body, .nav-menu').forEach(element => {
                    element.style.webkitOverflowScrolling = 'touch';
                    element.style.overflowY = 'auto';
                });
            }
        }
    }

    /**
     * Smooth Scroll Mejorado para Mobile
     */
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            // Aplicar a todos los links internos
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetId = link.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        this.scrollToElement(targetElement);
                    }
                });
            });
        }

        scrollToElement(element) {
            const headerHeight = document.querySelector('.main-header').offsetHeight || 70;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Viewport Height Fix para Mobile
     */
    class ViewportFix {
        constructor() {
            this.init();
        }

        init() {
            this.setViewportHeight();
            
            // Actualizar en resize y orientación
            window.addEventListener('resize', () => this.setViewportHeight());
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.setViewportHeight(), 100);
            });
        }

        setViewportHeight() {
            // Crear variable CSS con altura real del viewport
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Aplicar a elementos que usan 100vh
            const fullHeightElements = document.querySelectorAll('.hero-home, .modal, .nav-menu');
            fullHeightElements.forEach(element => {
                if (element.classList.contains('hero-home')) {
                    element.style.minHeight = `calc(var(--vh, 1vh) * 100)`;
                } else {
                    element.style.height = `calc(var(--vh, 1vh) * 100)`;
                }
            });
        }
    }

    /**
     * Lazy Loading Optimizado para Mobile
     */
    class MobileLazyLoad {
        constructor() {
            this.images = document.querySelectorAll('img[data-src]');
            this.imageOptions = {
                threshold: 0.01,
                rootMargin: '50px'
            };
            
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.createObserver();
            } else {
                // Fallback para navegadores antiguos
                this.loadAllImages();
            }
        }

        createObserver() {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, this.imageOptions);

            this.images.forEach(img => imageObserver.observe(img));
        }

        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                
                // Añadir clase cuando cargue
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
            }
        }

        loadAllImages() {
            this.images.forEach(img => this.loadImage(img));
        }
    }

    /**
     * Form Enhancements para Mobile
     */
    class MobileFormEnhancements {
        constructor() {
            this.forms = document.querySelectorAll('form');
            this.init();
        }

        init() {
            this.forms.forEach(form => {
                this.enhanceForm(form);
            });
        }

        enhanceForm(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Auto-scroll al siguiente campo
                if (input.type !== 'submit' && input.type !== 'button') {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && input.type !== 'textarea') {
                            e.preventDefault();
                            this.focusNextInput(input, inputs);
                        }
                    });
                }
                
                // Mejorar labels flotantes
                if (input.value) {
                    input.classList.add('has-value');
                }
                
                input.addEventListener('blur', () => {
                    if (input.value) {
                        input.classList.add('has-value');
                    } else {
                        input.classList.remove('has-value');
                    }
                });
                
                // Validación en tiempo real
                if (input.hasAttribute('required')) {
                    input.addEventListener('blur', () => this.validateInput(input));
                }
            });
        }

        focusNextInput(currentInput, allInputs) {
            const currentIndex = Array.from(allInputs).indexOf(currentInput);
            const nextInput = allInputs[currentIndex + 1];
            
            if (nextInput) {
                nextInput.focus();
                // Scroll suave al siguiente campo
                setTimeout(() => {
                    nextInput.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 100);
            }
        }

        validateInput(input) {
            const isValid = input.checkValidity();
            
            if (isValid) {
                input.classList.remove('error');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('error');
            }
        }
    }

    /**
     * Performance Monitor para Mobile
     */
    class MobilePerformance {
        constructor() {
            this.init();
        }

        init() {
            // Reducir animaciones en dispositivos lentos
            this.optimizeAnimations();
            
            // Defer scripts no críticos
            this.deferNonCriticalScripts();
            
            // Optimizar imágenes según conexión
            this.optimizeImagesForConnection();
        }

        optimizeAnimations() {
            // Detectar si el dispositivo es lento
            const isSlowDevice = navigator.hardwareConcurrency <= 2 || 
                                  navigator.deviceMemory <= 2;
            
            if (isSlowDevice) {
                document.body.classList.add('reduce-motion');
                
                // Deshabilitar AOS en dispositivos lentos
                if (typeof AOS !== 'undefined') {
                    AOS.init({ disable: true });
                }
            }
        }

        deferNonCriticalScripts() {
            // Scripts que pueden cargarse después
            const deferredScripts = [
                'https://www.googletagmanager.com/gtag/js',
                'facebook.com/tr.js'
            ];
            
            window.addEventListener('load', () => {
                setTimeout(() => {
                    deferredScripts.forEach(scriptUrl => {
                        const scripts = document.querySelectorAll(`script[src*="${scriptUrl}"]`);
                        scripts.forEach(script => {
                            if (!script.hasAttribute('defer')) {
                                script.setAttribute('defer', '');
                            }
                        });
                    });
                }, 2000);
            });
        }

        optimizeImagesForConnection() {
            if ('connection' in navigator) {
                const connection = navigator.connection;
                
                if (connection.saveData || connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g') {
                    // Cargar imágenes de menor calidad
                    document.querySelectorAll('img[data-low-src]').forEach(img => {
                        const lowSrc = img.getAttribute('data-low-src');
                        if (lowSrc) {
                            img.src = lowSrc;
                        }
                    });
                }
            }
        }
    }

    /**
     * Inicialización
     */
    document.addEventListener('DOMContentLoaded', () => {
        // Solo ejecutar en mobile
        if (MobileUtils.isMobile()) {
            console.log('📱 Iniciando mejoras mobile...');
            
            // Prevenir zoom en iOS
            MobileUtils.preventIOSZoom();
            
            // Inicializar módulos
            new MobileMenu();
            new TouchHandler();
            new SmoothScroll();
            new ViewportFix();
            new MobileLazyLoad();
            new MobileFormEnhancements();
            new MobilePerformance();
            
            // Agregar clase al body para estilos específicos
            document.body.classList.add('is-mobile');
            
            if (MobileUtils.isIOS()) {
                document.body.classList.add('is-ios');
            }
            
            if (MobileUtils.isAndroid()) {
                document.body.classList.add('is-android');
            }
            
            console.log('✅ Mejoras mobile cargadas correctamente');
        }
    });

    // Exponer utilidades globalmente si es necesario
    window.MobileUtils = MobileUtils;

})();