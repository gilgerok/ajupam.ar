/**
 * modal.js - Manejo de modales para AJuPaM
 * Version: 1.0.0
 */

(function () {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function () {
        initializeModals();
        initializeLigaDropdown();
        initializeInscripcionButton();
    });

    /**
     * Inicializar sistema de modales
     */
    function initializeModals() {
        // Obtener todos los modales
        const modals = document.querySelectorAll('.modal');

        // Configurar cada modal
        modals.forEach(modal => {
            // Cerrar modal al hacer clic en X
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(modal));
            }

            // Cerrar modal al hacer clic fuera
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });

        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    closeModal(activeModal);
                }
            }
        });
    }

    /**
     * Abrir modal
     * @param {string} modalId - ID del modal a abrir
     */
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body

            // Focus trap
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    /**
     * Cerrar modal
     * @param {HTMLElement} modal - Elemento modal a cerrar
     */
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll del body
        }
    }

    /**
     * Inicializar dropdown de liga
     */
    function initializeLigaDropdown() {
        // Obtener botones del submenu
        const submenuButtons = document.querySelectorAll('.btn-submenu[data-liga]');

        submenuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const ligaType = button.getAttribute('data-liga');

                if (ligaType === 'masculino') {
                    openModal('modalLigaMasculino');
                } else if (ligaType === 'femenino') {
                    openModal('modalLigaFemenino');
                }

                // Cerrar el dropdown
                const dropdown = button.closest('.liga-dropdown');
                if (dropdown) {
                    const submenu = dropdown.querySelector('.liga-submenu');
                    if (submenu) {
                        submenu.style.display = 'none';
                        setTimeout(() => {
                            submenu.style.display = '';
                        }, 100);
                    }
                }
            });
        });

        // Toggle del dropdown en mobile
        const toggleBtn = document.querySelector('.btn-liga-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const submenu = toggleBtn.nextElementSibling;
                if (submenu && submenu.classList.contains('liga-submenu')) {
                    const isVisible = submenu.style.display === 'block';
                    submenu.style.display = isVisible ? 'none' : 'block';

                    // Cambiar ícono
                    const icon = toggleBtn.querySelector('.fa-chevron-down');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-up');
                        icon.classList.toggle('fa-chevron-down');
                    }
                }
            });
        }

        // Manejo especial para móviles
        if (window.innerWidth <= 768) {
            const dropdowns = document.querySelectorAll('.liga-dropdown');

            dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.btn-liga-toggle');

                if (toggle) {
                    toggle.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        // Toggle de clase active para móviles
                        dropdown.classList.toggle('active');

                        // Cambiar ícono
                        const icon = toggle.querySelector('.fas');
                        if (icon) {
                            if (dropdown.classList.contains('active')) {
                                icon.classList.remove('fa-chevron-down');
                                icon.classList.add('fa-chevron-up');
                            } else {
                                icon.classList.remove('fa-chevron-up');
                                icon.classList.add('fa-chevron-down');
                            }
                        }
                    });
                }
            });

            // Cerrar dropdown al hacer clic fuera en móviles
            document.addEventListener('click', function (e) {
                if (!e.target.closest('.liga-dropdown')) {
                    dropdowns.forEach(dropdown => {
                        dropdown.classList.remove('active');
                        const icon = dropdown.querySelector('.btn-liga-toggle .fas');
                        if (icon) {
                            icon.classList.remove('fa-chevron-up');
                            icon.classList.add('fa-chevron-down');
                        }
                    });
                }
            });
        }

        // Actualizar al cambiar el tamaño de ventana
        window.addEventListener('resize', function () {
            const dropdowns = document.querySelectorAll('.liga-dropdown');

            if (window.innerWidth > 768) {
                // Remover clase active en desktop
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    /**
     * Inicializar botón de inscripción
     */
    function initializeInscripcionButton() {
        // Buscar el botón de inscripción a la liga
        const inscripcionBtns = document.querySelectorAll('a[href*="forms.gle/MULax5E14S5Jz3zWA"]');

        inscripcionBtns.forEach(btn => {
            // Si el botón está en la sección de proyectos y dice "Inscribite a la liga"
            if (btn.textContent.includes('Inscribite') && btn.closest('#proyectos')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal('modalInscripcion');
                });
            }
        });
    }

    /**
     * Función para mostrar mensaje de inscripción
     */
    window.showInscripcionMessage = function () {
        openModal('modalInscripcion');
    };

    // Exportar funciones al scope global para uso externo
    window.openModal = openModal;
    window.closeModal = function (modalId) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        closeModal(modal);
    };

})();