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
                const targetScrollMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navHeight - targetScrollMargin;

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
        'cv-downloads': 'portfolio',
        connect: 'connect',
        reflections: 'faith',
        'church-home': 'faith',
        'journey-documents': 'faith'
    };
    const navLinks = Array.from(document.querySelectorAll('#nav [data-nav-group]'));
    const sectionLinks = Array.from(document.querySelectorAll('#nav .nav-submenu-link[href^="#"], #mobile-menu a[href^="#"]'));
    const clickableLinks = Array.from(document.querySelectorAll('#nav a[href^="#"], #mobile-menu a[href^="#"]'));
    const seenIds = new Set();
    const sections = sectionLinks
        .map(link => link.getAttribute('href')?.slice(1))
        .filter(id => id && sectionGroups[id] && !seenIds.has(id) && seenIds.add(id))
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .sort((a, b) => a.offsetTop - b.offsetTop);
    let activeSectionId = null;
    let ticking = false;

    function setActiveSection(sectionId) {
        if (!sectionId || activeSectionId === sectionId) return;
        activeSectionId = sectionId;
        const activeGroup = sectionGroups[sectionId];

        navLinks.forEach(link => {
            const isActive = link.dataset.navGroup === activeGroup;
            link.classList.toggle('active', isActive);
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('text-[#CBD5E1]', !isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        sectionLinks.forEach(link => {
            const linkTarget = link.getAttribute('href');
            const isActive = linkTarget === `#${sectionId}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function updateActiveSection() {
        ticking = false;

        if (!sections.length) return;

        const navHeight = document.getElementById('nav')?.offsetHeight ?? 80;
        const marker = window.scrollY + navHeight + 32;
        let currentSection = sections[0];

        sections.forEach(section => {
            if (section.offsetTop <= marker) {
                currentSection = section;
            }
        });

        setActiveSection(currentSection.id);
    }

    function queueUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateActiveSection);
    }

    clickableLinks.forEach(link => {
        const href = link.getAttribute('href');
        const targetId = href?.slice(1);
        if (!targetId || !sectionGroups[targetId]) return;
        link.addEventListener('click', () => {
            setActiveSection(targetId);
            window.setTimeout(queueUpdate, 360);
        });
    });

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    updateActiveSection();
}

// Swipeable portrait compare
function initPortraitComparison() {
    document.querySelectorAll('[data-portrait-compare]').forEach(compare => {
        const showcase = compare.closest('[data-portrait-easter-egg]');
        const toggles = compare.parentElement?.querySelectorAll('[data-portrait-snap]') ?? [];
        let pointerId = null;
        let isDragging = false;
        let isRevealing = false;
        let isRevealed = showcase ? showcase.classList.contains('is-revealed') : true;
        let revealTimerId = null;
        let rockTimerId = null;
        let clickStage = Number(showcase?.dataset.portraitClickStage ?? 0) || 0;

        function revealEasterEgg() {
            if (isRevealed || isRevealing) return;
            isRevealing = true;
            showcase?.classList.add('is-revealing');
            compare.setAttribute('aria-busy', 'true');
            compare.setAttribute('aria-expanded', 'false');

            revealTimerId = window.setTimeout(() => {
                isRevealing = false;
                isRevealed = true;
                clickStage = 0;
                showcase?.classList.remove('is-revealing');
                showcase?.classList.add('is-revealed');
                showcase?.removeAttribute('data-portrait-click-stage');
                showcase?.removeAttribute('data-portrait-rock');
                compare.removeAttribute('role');
                compare.removeAttribute('aria-busy');
                compare.setAttribute('aria-label', 'Swipeable portrait comparison between the polished portrait and the original photo');
                compare.setAttribute('aria-expanded', 'true');
                compare.style.removeProperty('--portrait-crack-one-x');
                compare.style.removeProperty('--portrait-crack-one-y');
                compare.style.removeProperty('--portrait-crack-two-x');
                compare.style.removeProperty('--portrait-crack-two-y');
                setReveal(50);
                revealTimerId = null;
            }, 2000);
        }

        function clearRevealTimer() {
            if (revealTimerId === null) return;
            window.clearTimeout(revealTimerId);
            revealTimerId = null;
        }

        function clearRockTimer() {
            if (rockTimerId === null) return;
            window.clearTimeout(rockTimerId);
            rockTimerId = null;
        }

        function syncRevealState() {
            if (!isRevealed) return;
            compare.removeAttribute('role');
            compare.setAttribute('aria-label', 'Swipeable portrait comparison between the polished portrait and the original photo');
            compare.setAttribute('aria-expanded', 'true');
        }

        function syncClickStage() {
            if (!showcase) return;
            if (clickStage <= 0 || isRevealed) {
                showcase.removeAttribute('data-portrait-click-stage');
                return;
            }
            showcase.dataset.portraitClickStage = String(Math.min(clickStage, 2));
        }

        function clamp(value) {
            return Math.min(100, Math.max(0, value));
        }

        function isInteractiveTarget(target) {
            if (!(target instanceof Element)) return false;
            const interactiveAncestor = target.closest('a, button, input, textarea, select, summary, [role="button"]');
            return interactiveAncestor !== null && interactiveAncestor !== compare;
        }

        function triggerRock(level) {
            if (!showcase) return;
            clearRockTimer();
            showcase.dataset.portraitRock = level;
            rockTimerId = window.setTimeout(() => {
                showcase.removeAttribute('data-portrait-rock');
                rockTimerId = null;
            }, level === 'hard' ? 760 : 560);
        }

        function setCrackOrigin(slot, clientX, clientY) {
            const rect = compare.getBoundingClientRect();
            const prefix = slot === 2 ? '--portrait-crack-two' : '--portrait-crack-one';
            if (!rect.width || !rect.height || typeof clientX !== 'number' || typeof clientY !== 'number') {
                compare.style.setProperty(`${prefix}-x`, '50%');
                compare.style.setProperty(`${prefix}-y`, '31%');
                return;
            }

            const xPercent = clamp(((clientX - rect.left) / rect.width) * 100);
            const yPercent = clamp(((clientY - rect.top) / rect.height) * 100);
            const clampedX = Math.min(86, Math.max(14, xPercent));
            const clampedY = Math.min(78, Math.max(14, yPercent));

            compare.style.setProperty(`${prefix}-x`, `${clampedX}%`);
            compare.style.setProperty(`${prefix}-y`, `${clampedY}%`);
        }

        function handleHiddenClick(event) {
            if (isRevealed || isRevealing) return;

            setCrackOrigin(Math.min(clickStage + 1, 2), event?.clientX, event?.clientY);
            clickStage = Math.min(clickStage + 1, 3);
            syncClickStage();

            if (clickStage === 1) {
                triggerRock('soft');
                return;
            }

            if (clickStage === 2) {
                triggerRock('hard');
                return;
            }

            revealEasterEgg();
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
            if (!isRevealed || isRevealing) return;
            if (isInteractiveTarget(event.target)) return;
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

        compare.addEventListener('click', event => {
            if (isInteractiveTarget(event.target)) return;
            if (!isRevealed) {
                handleHiddenClick(event);
                return;
            }
        });

        compare.addEventListener('keydown', event => {
            if (!isRevealed && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                handleHiddenClick();
                return;
            }

            if (!isRevealed || isRevealing) return;

            const current = Number.parseFloat(compare.style.getPropertyValue('--portrait-reveal')) || 100;
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

        syncRevealState();
        syncClickStage();

        setReveal(Number.parseFloat(compare.style.getPropertyValue('--portrait-reveal')) || 100);

        window.addEventListener('beforeunload', clearRevealTimer, { once: true });
        window.addEventListener('beforeunload', clearRockTimer, { once: true });
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
