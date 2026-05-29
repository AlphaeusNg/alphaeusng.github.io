// Main shared utilities for Alphaeus Ng portfolio
// Extracted from monolithic index.html for maintainability

// Tailwind script
function initTailwind() {
    document.documentElement.style.setProperty('--accent-gold', '#C9A227');
}

// Navbar scroll effect
function initNavbar() {
    const nav = document.getElementById('nav');
    
    function handleScroll() {
        if (window.scrollY > 20) {
            nav.classList.add('nav-scrolled', 'shadow-xl');
        } else {
            nav.classList.remove('nav-scrolled', 'shadow-xl');
        }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

// Mobile menu
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    
    if (!btn || !menu) return;

    function resetMobileNavPanels() {
        document.querySelectorAll('.mobile-nav-toggle').forEach(toggle => {
            const panel = document.getElementById(toggle.getAttribute('aria-controls'));
            panel?.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    btn.addEventListener('click', () => {
        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden');
        
        if (isHidden) {
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
            `;
        } else {
            resetMobileNavPanels();
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.add('hidden');
            resetMobileNavPanels();
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
        });
    });
}

// Desktop nav dropdowns + mobile nav accordions
function initExploreNavigation() {
    const desktopMenus = Array.from(document.querySelectorAll('[data-nav-menu]'));
    let openMenu = null;

    function getDesktopTrigger(menu) {
        return menu.querySelector('.nav-pill');
    }

    function getDesktopPanel(menu) {
        return menu.querySelector('.nav-submenu');
    }

    function closeDesktopMenu(menu) {
        if (!menu) return;
        const trigger = getDesktopTrigger(menu);
        const panel = getDesktopPanel(menu);
        panel?.classList.add('hidden');
        trigger?.setAttribute('aria-expanded', 'false');
        if (openMenu === menu) {
            openMenu = null;
        }
    }

    function openDesktopMenu(menu) {
        if (!menu) return;
        if (openMenu && openMenu !== menu) {
            closeDesktopMenu(openMenu);
        }
        const trigger = getDesktopTrigger(menu);
        const panel = getDesktopPanel(menu);
        panel?.classList.remove('hidden');
        trigger?.setAttribute('aria-expanded', 'true');
        openMenu = menu;
    }

    desktopMenus.forEach(menu => {
        let closeTimer = null;
        const trigger = getDesktopTrigger(menu);

        function clearCloseTimer() {
            if (closeTimer) {
                window.clearTimeout(closeTimer);
                closeTimer = null;
            }
        }

        function queueClose() {
            clearCloseTimer();
            closeTimer = window.setTimeout(() => closeDesktopMenu(menu), 100);
        }

        menu.addEventListener('mouseenter', () => {
            clearCloseTimer();
            openDesktopMenu(menu);
        });

        menu.addEventListener('mouseleave', queueClose);
        menu.addEventListener('focusin', () => {
            clearCloseTimer();
            openDesktopMenu(menu);
        });
        menu.addEventListener('focusout', event => {
            if (!menu.contains(event.relatedTarget)) {
                queueClose();
            }
        });

    });

    document.addEventListener('click', event => {
        if (openMenu && !openMenu.contains(event.target)) {
            closeDesktopMenu(openMenu);
        }
    });

    const mobileToggles = document.querySelectorAll('.mobile-nav-toggle');
    mobileToggles.forEach(toggle => {
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!panel) return;

        toggle.addEventListener('click', () => {
            const willOpen = panel.classList.contains('hidden');

            mobileToggles.forEach(otherToggle => {
                const otherPanel = document.getElementById(otherToggle.getAttribute('aria-controls'));
                if (!otherPanel || otherToggle === toggle) return;
                otherPanel.classList.add('hidden');
                otherToggle.setAttribute('aria-expanded', 'false');
            });

            panel.classList.toggle('hidden', !willOpen);
            toggle.setAttribute('aria-expanded', String(willOpen));
        });
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Fade-in on scroll
function initFadeIns() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    });

    document.querySelectorAll('#story .prose-elegant, #journey .timeline-item, #craft .card, #thoughts .blog-post, #reflections .faith-panel').forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = (index * 60) + 'ms';
        observer.observe(el);
    });
}

// Active nav link highlighting
function initActiveNav() {
    const sectionGroups = {
        story: 'portfolio',
        journey: 'portfolio',
        craft: 'portfolio',
        thoughts: 'portfolio',
        connect: 'connect',
        reflections: 'faith'
    };
    const navLinks = document.querySelectorAll('#nav [data-nav-group]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeGroup = sectionGroups[entry.target.id];
                if (!activeGroup) return;
                
                navLinks.forEach(link => {
                    link.classList.remove('active', 'text-white');
                    link.classList.add('text-[#CBD5E1]');
                    
                    if (link.dataset.navGroup === activeGroup) {
                        link.classList.add('active', 'text-white');
                        link.classList.remove('text-[#CBD5E1]');
                    }
                });
            }
        });
    }, { 
        threshold: 0.4,
        rootMargin: "-80px 0px -40% 0px"
    });

    Object.keys(sectionGroups).forEach(id => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
    });
}

// Swipeable portrait compare
function initPortraitComparison() {
    document.querySelectorAll('[data-portrait-compare]').forEach(compare => {
        const toggles = compare.parentElement?.querySelectorAll('[data-portrait-snap]') ?? [];
        let pointerId = null;
        let isDragging = false;

        function clamp(value) {
            return Math.min(94, Math.max(6, value));
        }

        function setReveal(value) {
            const reveal = clamp(value);
            compare.style.setProperty('--portrait-reveal', `${reveal}%`);

            toggles.forEach(toggle => {
                const target = Number(toggle.dataset.portraitSnap);
                const isActive = Math.abs(target - reveal) <= 18;
                toggle.classList.toggle('is-active', isActive);
                toggle.setAttribute('aria-pressed', String(isActive));
            });
        }

        function setRevealFromClientX(clientX) {
            const rect = compare.getBoundingClientRect();
            if (!rect.width) return;
            const reveal = ((clientX - rect.left) / rect.width) * 100;
            setReveal(reveal);
        }

        function stopDragging() {
            isDragging = false;
            pointerId = null;
            compare.classList.remove('is-dragging');
        }

        function handlePointerMove(event) {
            if (!isDragging) return;
            if (pointerId !== null && event.pointerId !== undefined && pointerId !== event.pointerId) return;
            setRevealFromClientX(event.clientX);
        }

        compare.addEventListener('pointerdown', event => {
            event.preventDefault();
            pointerId = event.pointerId;
            isDragging = true;
            compare.classList.add('is-dragging');
            if (typeof compare.setPointerCapture === 'function') {
                compare.setPointerCapture(pointerId);
            }
            setRevealFromClientX(event.clientX);
        });

        compare.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointermove', handlePointerMove, { passive: true });

        compare.addEventListener('pointerup', event => {
            if (pointerId !== event.pointerId) return;
            stopDragging();
        });

        compare.addEventListener('pointercancel', stopDragging);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);
        compare.addEventListener('dragstart', event => {
            event.preventDefault();
        });

        compare.addEventListener('keydown', event => {
            const current = Number.parseFloat(compare.style.getPropertyValue('--portrait-reveal')) || 74;
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setReveal(current - 6);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                setReveal(current + 6);
            }
        });

        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                setReveal(Number(toggle.dataset.portraitSnap));
            });
        });

        setReveal(Number.parseFloat(compare.style.getPropertyValue('--portrait-reveal')) || 74);
    });
}

// Keyboard accessibility + Konami egg
function initAccessibility() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('project-modal');
            if (modal && !modal.classList.contains('hidden')) {
                if (typeof closeProjectModal === 'function') {
                    closeProjectModal();
                } else {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    document.body.style.overflow = '';
                }
            } else {
                const menu = document.getElementById('mobile-menu');
                const btn = document.getElementById('mobile-menu-btn');
                if (menu && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                    document.querySelectorAll('.mobile-nav-toggle').forEach(toggle => {
                        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
                        panel?.classList.add('hidden');
                        toggle.setAttribute('aria-expanded', 'false');
                    });
                    if (btn) {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        `;
                    }
                }
                document.querySelectorAll('[data-nav-menu]').forEach(menuGroup => {
                    menuGroup.querySelector('.nav-submenu')?.classList.add('hidden');
                    menuGroup.querySelector('.nav-pill')?.setAttribute('aria-expanded', 'false');
                });
            }
        }
    });

    // Konami code for gold mode (fun, respectful easter egg)
    let keys = [];
    const konami = [38,38,40,40,37,39,37,39,66,65];
    document.addEventListener('keydown', function(e) {
        keys.push(e.keyCode);
        if (keys.length > konami.length) keys.shift();
        if (JSON.stringify(keys) === JSON.stringify(konami)) {
            document.body.style.setProperty('--accent-gold', '#EAB308');
            document.querySelectorAll('.gold-accent, .text-\\[\\#C9A227\\], [class*="text-[#C9A227]"]').forEach(el => {
                el.style.color = '#EAB308';
            });
            keys = [];
        }
    });
}

// Boot everything
function init() {
    initTailwind();
    initNavbar();
    initMobileMenu();
    initExploreNavigation();
    initSmoothScroll();
    initFadeIns();
    initActiveNav();
    initPortraitComparison();
    initAccessibility();
    
    console.log('%c[Alphaeus Ng Portfolio] Main JS initialized. Structured & cleaned.', 'color:#475569;font-size:9px');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
