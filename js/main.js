/**
 * main.js - AJuPaM Web App
 * Version 2.2 - Separación de tracking y corrección de contadores/galerías
 */

/**
 * Función para detectar el tipo de dispositivo
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

/**
 * Función optimizada para animación de contadores
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
 * Manejo mejorado de formularios sin validación visual inicial
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

        input.addEventListener('blur', function () {
            hasInteracted = true;
            this.classList.add('touched');
            validateField(this);
        });

        input.addEventListener('input', function () {
            if (hasInteracted) {
                validateField(this);
            }
        });

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
            const firstError = this.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            announceToScreenReader('Por favor, corregí los errores en el formulario antes de enviarlo');
            return;
        }

        // Estado de loading
        formButton.innerHTML = '<span class="loading-spinner"></span> Enviando...';
        formButton.disabled = true;
        this.classList.add('loading');

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.parentElement.innerHTML = `
                    <div class="form-feedback-success" role="alert">
                        <h3>¡Gracias por tu interés!</h3>
                        <p>Tu solicitud ha sido enviada exitosamente. Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24-48 horas hábiles.</p>
                        <div class="success-animation">✔</div>
                    </div>
                `;

                announceToScreenReader('Formulario enviado exitosamente');

            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            console.error('Error en envío de formulario:', error);

            const errorMsg = `
                <div class="error-state" role="alert">
                    <strong>Hubo un problema al enviar tu solicitud.</strong><br>
                    Por favor, intenta nuevamente o contáctanos directamente por WhatsApp al +54 9 261 253-4840.
                </div>
            `;

            const existingError = this.querySelector('.error-state');
            if (existingError) existingError.remove();

            this.insertAdjacentHTML('beforeend', errorMsg);

            formButton.innerHTML = originalButtonHTML;
            formButton.disabled = false;
            this.classList.remove('loading');

            announceToScreenReader('Error al enviar el formulario. Por favor, intenta nuevamente');
        }
    });
}

/**
 * Función para anunciar mensajes a lectores de pantalla
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
        if (e.key === 'Escape') {
            const navMenu = document.querySelector('.nav-menu.active');
            if (navMenu) {
                window.closeMenu?.();
            }
        }

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

        setTimeout(() => {
            const firstLink = navMenu.querySelector('a');
            if (firstLink) firstLink.focus();
        }, 300);
    };

    hamburger.addEventListener('click', () => {
        const isActive = navMenu.classList.contains('active');
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
            hamburger.focus();
        }
    });

    window.closeMenu = closeMenu;
}

/**
 * Inicialización del carrusel
 */
function initCarousel() {
    console.log('🎠 Inicializando carruseles...');
    
    // Verificar que Splide esté disponible
    if (typeof Splide === 'undefined') {
        console.warn('⚠️ Splide no está cargado todavía');
        setTimeout(initCarousel, 500);
        return;
    }
    
    // Carrusel general de momentos
    const splideElement = document.querySelector('#momentos-ajupam .splide');
    if (splideElement) {
        try {
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

            splide.mount();
            console.log('✅ Carrusel momentos inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar carrusel momentos:', error);
        }
    }

    // Configuración específica para galería de premiadores
    const galeriaElement = document.querySelector('#galeria .splide, #galeria-splide');
    if (galeriaElement) {
        try {
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
                pagination: true,
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
                        arrows: false,
                        pagination: true
                    },
                    768: {
                        perPage: 2,
                        gap: '20px',
                        arrows: false,
                        pagination: true
                    },
                    1024: {
                        perPage: 3
                    }
                }
            });

            const galleryImages = galeriaElement.querySelectorAll('img');
            galleryImages.forEach(img => {
                img.addEventListener('error', function () {
                    this.src = 'https://via.placeholder.com/600x600/cccccc/666666?text=Imagen+No+Disponible';
                    this.alt = 'Imagen temporalmente no disponible';
                });

                img.addEventListener('load', function () {
                    this.classList.add('loaded');
                });
            });

            galeriaSplide.mount();
            console.log('✅ Galería de premiadores inicializada correctamente');
            
            setTimeout(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                checkSectionsVisibility();
            }, 500);
            
        } catch (error) {
            console.error('❌ Error al inicializar galería:', error);
            setTimeout(() => {
                checkSectionsVisibility();
            }, 1000);
        }
    }

    // Configuración específica para otros carruseles si existen
    const allSplides = document.querySelectorAll('.splide:not(#momentos-ajupam .splide):not(#galeria .splide):not(#galeria-splide)');
    allSplides.forEach((element, index) => {
        try {
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
        } catch (error) {
            console.error(`❌ Error al inicializar carrusel genérico ${index + 1}:`, error);
        }
    });
}

/**
 * Función para verificar visibilidad de secciones después de la galería
 */
function checkSectionsVisibility() {
    const sectionsAfterGallery = document.querySelectorAll('#galeria ~ section, #galeria + section');
    
    sectionsAfterGallery.forEach(section => {
        if (section.offsetHeight === 0 || getComputedStyle(section).display === 'none') {
            console.warn(`⚠️ Sección ${section.id} no está visible, forzando refresh`);
            
            section.style.display = 'block';
            section.style.visibility = 'visible';
            
            // Trigger reflow
            section.offsetHeight;
            
            initSectionObservers(section);
        }
    });
}

/**
 * Inicializar observadores específicos para una sección
 */
function initSectionObservers(section) {
    const counters = section.querySelectorAll('.stat-number');
    if (counters.length > 0) {
        counters.forEach(counter => {
            if (!counter.classList.contains('is-visible')) {
                const specificObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const targetAttr = entry.target.getAttribute('data-target');
                            if (targetAttr !== null) {
                                const target = parseInt(targetAttr, 10);
                                animateCounter(entry.target, target);
                                specificObserver.unobserve(entry.target);
                            }
                        }
                    });
                }, {
                    threshold: getDeviceType() === 'mobile' ? 0.1 : 0.3,
                    rootMargin: getDeviceType() === 'mobile' ? '50px' : '0px 0px -50px 0px'
                });
                
                specificObserver.observe(counter);
            }
        });
    }
    
    if (typeof AOS !== 'undefined' && section.querySelector('[data-aos]')) {
        AOS.refresh();
    }
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
 * Setup de fallbacks para imágenes
 */
function setupImageFallbacks() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (img.dataset.fallbackSet) return;

        img.dataset.fallbackSet = 'true';

        img.addEventListener('error', function () {
            if (this.src.includes('placeholder.com')) return;

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

/**
 * Inicialización principal
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando AJuPaM Web App v2.2...');

    window.pageLoadTime = Date.now();

    try {
        // Inicializar AOS con configuración optimizada
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 700,
                once: true,
                offset: getDeviceType() === 'mobile' ? 20 : 50,
                disable: false,
                easing: 'ease-out-cubic'
            });
            
            console.log('✅ AOS inicializado');
        }

        // Setup lazy loading
        setupLazyLoading();

        // Imagenes erróneas o inexistentes
        setupImageFallbacks();

        // Mejorar accesibilidad
        enhanceAccessibility();

        // Inicializar menú móvil
        initMobileMenu();

        // Inicializar carrusel después de que Splide se cargue
        if (document.querySelector('.splide')) {
            if (typeof Splide !== 'undefined') {
                setTimeout(initCarousel, 300);
            } else {
                // Esperar a que Splide se cargue
                const checkSplide = setInterval(() => {
                    if (typeof Splide !== 'undefined') {
                        clearInterval(checkSplide);
                        initCarousel();
                    }
                }, 100);
            }
        }

        // Navegación suave
        document.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) return;

                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });

                    if (window.closeMenu) {
                        const navMenu = document.querySelector('.nav-menu.active');
                        if (navMenu) window.closeMenu();
                    }
                }
            });
        });

        // Observador mejorado para contadores animados
        const countersObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const targetAttr = counter.getAttribute('data-target');
                    if (targetAttr !== null && !counter.classList.contains('is-visible')) {
                        const target = parseInt(targetAttr, 10);
                        setTimeout(() => {
                            animateCounter(counter, target);
                        }, getDeviceType() === 'mobile' ? 200 : 0);
                    }
                });
            });
        }, {
            threshold: getDeviceType() === 'mobile' ? 0.1 : 0.3,
            rootMargin: getDeviceType() === 'mobile' ? '50px 0px' : '0px 0px -100px 0px'
        });

        // Observar todas las secciones con contadores
        setTimeout(() => {
            document.querySelectorAll('section').forEach(section => {
                if (section.querySelector('.stat-number')) {
                    countersObserver.observe(section);
                }
            });
        }, 500);

        // Gestión de formularios con validación corregida
        const contactForms = document.querySelectorAll('.contacto-form form, form[action*="formspree"]');
        contactForms.forEach(form => {
            handleFormSubmission(form);
        });

        // Actualizar año de copyright
        const copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) {
            copyrightYear.textContent = new Date().getFullYear();
        }

        // Verificación adicional para elementos después de la galería
        setTimeout(() => {
            checkSectionsVisibility();
            
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
            
            const contactSection = document.getElementById('contacto');
            if (contactSection && (contactSection.offsetHeight === 0 || getComputedStyle(contactSection).display === 'none')) {
                console.warn('⚠️ Sección de contacto no visible, forzando refresh');
                contactSection.style.display = 'flex';
                contactSection.style.visibility = 'visible';
                contactSection.offsetHeight; // Trigger reflow
            }
        }, 1000);

        // Manejo del resize para reajustar elementos
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkSectionsVisibility();
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
            }, 250);
        });

        console.log('✅ AJuPaM Web App v2.2 inicializada correctamente');

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
    }
});

// Exponer funciones globales útiles
window.getDeviceType = getDeviceType;
window.announceToScreenReader = announceToScreenReader;
window.checkSectionsVisibility = checkSectionsVisibility;