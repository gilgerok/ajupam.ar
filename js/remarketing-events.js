/**
 * remarketing-events.js - Eventos adicionales para remarketing en GA4
 * Agregar este código al final del archivo main.js o en un archivo separado
 */

/**
 * Eventos de tracking para remarketing y audiencias personalizadas
 */
function setupRemarketingEvents() {
    
    // ========================================
    // SECCIÓN PROYECTOS - Tracking de intereses
    // ========================================
    
    // La Liga AJuPaM - Alto interés
    const ligaBtn = document.querySelector('a[href="#la-liga"]');
    if (ligaBtn) {
        ligaBtn.addEventListener('click', () => {
            trackEvent('project_interest', {
                project_name: 'liga_ajupam',
                action_type: 'view_more',
                interest_level: 'high',
                remarketing_category: 'potential_player'
            });
        });
    }

    // Ranking Unificado
    const rankingBtn = document.querySelector('a[href*="rankingajupam"]');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            trackEvent('project_interest', {
                project_name: 'ranking_unificado',
                action_type: 'external_visit',
                interest_level: 'medium',
                remarketing_category: 'engaged_visitor'
            });
        });
    }

    // Registrar Club - Potencial sponsor/partner
    const clubBtn = document.querySelector('a[data-link="link_registrar_club"]');
    if (clubBtn) {
        clubBtn.addEventListener('click', () => {
            trackEvent('conversion_intent', {
                intent_type: 'register_club',
                user_role: 'club_owner',
                conversion_value: 'high',
                remarketing_category: 'potential_partner'
            });
        });
    }

    // Sumarse como Jugador - Conversión directa
    document.querySelectorAll('a[data-link="link_sumarse_jugador"]').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('conversion_intent', {
                intent_type: 'join_as_player',
                user_role: 'player',
                conversion_value: 'very_high',
                remarketing_category: 'hot_lead_player'
            });
        });
    });

    // Proyectos próximamente - Early adopters
    document.querySelectorAll('.project-badge').forEach(badge => {
        const card = badge.closest('.project-card');
        if (card) {
            card.addEventListener('click', () => {
                const projectTitle = card.querySelector('h3')?.textContent || 'unknown';
                trackEvent('future_project_interest', {
                    project_name: projectTitle.toLowerCase().replace(/\s+/g, '_'),
                    status: badge.textContent,
                    remarketing_category: 'early_adopter'
                });
            });
        }
    });

    // ========================================
    // SECCIÓN LA LIGA - Engagement profundo
    // ========================================
    
    // Toggle del dropdown de Liga
    const ligaToggle = document.querySelector('.btn-liga-toggle');
    if (ligaToggle) {
        ligaToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = document.querySelector('.liga-submenu');
            const isOpening = !submenu?.classList.contains('active');
            
            if (isOpening) {
                trackEvent('liga_interaction', {
                    action: 'open_categories',
                    engagement_level: 'high',
                    remarketing_category: 'liga_interested'
                });
            }
            
            // Lógica del toggle
            submenu?.classList.toggle('active');
        });
    }

    // Clicks en categorías específicas de Liga
    document.querySelectorAll('.btn-submenu[data-liga]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoria = btn.dataset.liga;
            
            trackEvent('liga_category_view', {
                category: categoria,
                action: 'open_modal',
                interest_level: 'very_high',
                remarketing_category: `liga_${categoria}_interested`
            });
        });
    });

    // Inscripción a la próxima liga - ALTA CONVERSIÓN
    const inscripcionBtn = document.querySelector('.btn-inscripcion');
    if (inscripcionBtn) {
        inscripcionBtn.addEventListener('click', (e) => {
            trackEvent('liga_signup_intent', {
                action: 'inscription_click',
                conversion_probability: 'very_high',
                remarketing_category: 'ready_to_signup'
            });
        });
    }

    // Links dentro de modales de Liga
    document.querySelectorAll('.liga-link').forEach(link => {
        link.addEventListener('click', () => {
            const category = link.querySelector('span')?.textContent || 'unknown';
            
            trackEvent('liga_spreadsheet_view', {
                category: category,
                engagement: 'deep',
                user_intent: 'checking_standings',
                remarketing_category: 'active_follower'
            });
        });
    });

    // ========================================
    // SECCIÓN SPONSORS - Potenciales partners
    // ========================================
    
    // Tipos de sponsors
    document.querySelectorAll('.sponsor-type-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const sponsorType = card.querySelector('h3')?.textContent || 'unknown';
            const href = card.getAttribute('href');
            
            trackEvent('sponsor_interest', {
                sponsor_type: sponsorType.toLowerCase().replace(/\s+/g, '_'),
                action: 'explore_type',
                business_intent: 'high',
                remarketing_category: 'potential_sponsor'
            });
            
            // Navegar después del tracking
            setTimeout(() => {
                window.location.href = href;
            }, 100);
        });
    });

    // ========================================
    // TRACKING DE TIEMPO EN SECCIONES CLAVE
    // ========================================
    
    let sectionTimers = {};
    
    const trackSectionTime = (sectionId, sectionName) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Iniciar timer
                    sectionTimers[sectionId] = Date.now();
                } else if (sectionTimers[sectionId]) {
                    // Calcular tiempo y enviar evento
                    const timeSpent = Math.round((Date.now() - sectionTimers[sectionId]) / 1000);
                    
                    if (timeSpent > 3) { // Solo si estuvo más de 3 segundos
                        trackEvent('section_engagement', {
                            section_name: sectionName,
                            time_spent_seconds: timeSpent,
                            engagement_level: timeSpent > 30 ? 'high' : timeSpent > 10 ? 'medium' : 'low',
                            remarketing_category: `engaged_${sectionName}`
                        });
                    }
                    
                    delete sectionTimers[sectionId];
                }
            });
        }, { threshold: 0.5 });
        
        const section = document.getElementById(sectionId);
        if (section) observer.observe(section);
    };
    
    // Trackear secciones clave
    trackSectionTime('proyectos', 'projects');
    trackSectionTime('la-liga', 'liga');
    trackSectionTime('sponsors-cta', 'sponsors');
    trackSectionTime('contacto', 'contact');

    // ========================================
    // MICRO-CONVERSIONES PARA REMARKETING
    // ========================================
    
    // Video/contenido engagement
    document.querySelectorAll('.splide__slide').forEach((slide, index) => {
        slide.addEventListener('click', () => {
            trackEvent('content_interaction', {
                content_type: 'gallery_image',
                slide_index: index,
                remarketing_category: 'content_engaged'
            });
        });
    });

    // Interacción con estadísticas (muestra alto interés)
    document.querySelectorAll('.stat-number').forEach(stat => {
        stat.addEventListener('mouseenter', () => {
            const statLabel = stat.nextElementSibling?.textContent || 'unknown';
            
            trackEvent('stats_hover', {
                stat_viewed: statLabel,
                interest_signal: 'investigating',
                remarketing_category: 'detail_oriented'
            });
        }, { once: true }); // Solo la primera vez
    });

    // ========================================
    // EVENTOS DE ABANDONO (para recuperación)
    // ========================================
    
    // Detectar intención de salida
    let exitIntentShown = false;
    
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !exitIntentShown) {
            exitIntentShown = true;
            
            // Determinar en qué sección estaba
            const visibleSection = Array.from(document.querySelectorAll('section'))
                .find(section => {
                    const rect = section.getBoundingClientRect();
                    return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
                });
            
            const sectionId = visibleSection?.id || 'unknown';
            
            trackEvent('exit_intent', {
                last_section_viewed: sectionId,
                time_on_site: Math.round((Date.now() - window.pageLoadTime) / 1000),
                remarketing_category: 'abandonment_risk'
            });
        }
    });

    // ========================================
    // EVENTOS PARA SEGMENTACIÓN AVANZADA
    // ========================================
    
    // Detectar si es jugador, club o sponsor potencial
    let userProfile = {
        playerSignals: 0,
        clubSignals: 0,
        sponsorSignals: 0
    };
    
    // Actualizar perfil basado en acciones
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;
        
        const href = target.getAttribute('href') || '';
        const text = target.textContent.toLowerCase();
        
        if (text.includes('jugador') || text.includes('sumate') || href.includes('ranking')) {
            userProfile.playerSignals++;
        } else if (text.includes('club') || text.includes('predio')) {
            userProfile.clubSignals++;
        } else if (text.includes('sponsor') || text.includes('marca')) {
            userProfile.sponsorSignals++;
        }
        
        // Enviar perfil después de 5 interacciones
        const totalSignals = userProfile.playerSignals + userProfile.clubSignals + userProfile.sponsorSignals;
        if (totalSignals === 5) {
            const dominantProfile = Object.entries(userProfile)
                .sort(([,a], [,b]) => b - a)[0][0]
                .replace('Signals', '');
            
            trackEvent('user_profile_identified', {
                profile_type: dominantProfile,
                player_score: userProfile.playerSignals,
                club_score: userProfile.clubSignals,
                sponsor_score: userProfile.sponsorSignals,
                remarketing_category: `qualified_${dominantProfile}`
            });
        }
    });
}

// Inicializar eventos de remarketing cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRemarketingEvents);
} else {
    setupRemarketingEvents();
}

/**
 * AUDIENCIAS SUGERIDAS PARA GOOGLE ADS:
 * 
 * 1. HOT LEADS - JUGADORES
 *    - Evento: conversion_intent con intent_type = 'join_as_player'
 *    - Evento: liga_signup_intent
 *    
 * 2. INTERESADOS EN LA LIGA
 *    - Evento: liga_interaction
 *    - Evento: liga_category_view
 *    - Evento: section_engagement con section_name = 'liga' y time > 30
 *    
 * 3. POTENCIALES SPONSORS
 *    - Evento: sponsor_interest
 *    - Evento: conversion_intent con user_role = 'club_owner'
 *    - Evento: user_profile_identified con profile_type = 'sponsor'
 *    
 * 4. USUARIOS COMPROMETIDOS
 *    - Evento: section_engagement con engagement_level = 'high'
 *    - Evento: liga_spreadsheet_view
 *    - Evento: time_on_page > 120 segundos
 *    
 * 5. RECUPERACIÓN DE ABANDONOS
 *    - Evento: exit_intent
 *    - Evento: form_submit_attempt sin form_submit_success
 */