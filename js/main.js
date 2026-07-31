// Main shared utilities for Alphaeus Ng portfolio
// Extracted from monolithic index.html for maintainability

// Tailwind script
function initTailwind() {
    document.documentElement.style.setProperty('--accent-gold', '#C9A227');
}

// Navbar scroll effect
function initNavbar() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let lastScrollY = Math.max(0, window.scrollY);
    let ticking = false;

    function handleScroll() {
        const scrollY = Math.max(0, window.scrollY);
        const delta = scrollY - lastScrollY;

        if (scrollY > 20) {
            nav.classList.add('nav-scrolled', 'shadow-xl');
        } else {
            nav.classList.remove('nav-scrolled', 'shadow-xl');
        }

        if (scrollY <= 16 || delta < 0 || nav.matches(':focus-within') || nav.classList.contains('mobile-menu-open')) {
            nav.classList.remove('is-scroll-hidden');
        } else if (delta > 0 && scrollY > nav.offsetHeight) {
            nav.classList.add('is-scroll-hidden');
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    function queueUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(handleScroll);
    }

    nav.addEventListener('focusin', () => nav.classList.remove('is-scroll-hidden'));
    window.addEventListener('scroll', queueUpdate, { passive: true });
    handleScroll();
}

// Mobile menu
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const nav = document.getElementById('nav');
    const scrim = document.getElementById('mobile-menu-scrim');
    
    if (!btn || !menu || !nav || !scrim) return;

    const menuIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    `;
    const closeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
    `;

    function resetMobileNavPanels() {
        document.querySelectorAll('.mobile-nav-toggle').forEach(toggle => {
            const panel = document.getElementById(toggle.getAttribute('aria-controls'));
            panel?.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    function setMobileMenuOpen(isOpen, { resetPanels = !isOpen } = {}) {
        menu.classList.toggle('hidden', !isOpen);
        nav.classList.toggle('mobile-menu-open', isOpen);
        document.body.classList.toggle('mobile-menu-open', isOpen);
        scrim.hidden = !isOpen;
        scrim.setAttribute('aria-hidden', String(!isOpen));
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        btn.innerHTML = isOpen ? closeIcon : menuIcon;
        if (resetPanels) resetMobileNavPanels();
    }

    function closeMobileMenu({ restoreFocus = false } = {}) {
        if (menu.classList.contains('hidden')) return;
        setMobileMenuOpen(false);
        if (restoreFocus) btn.focus({ preventScroll: true });
    }

    btn.addEventListener('click', () => {
        setMobileMenuOpen(menu.classList.contains('hidden'));
    });
    scrim.addEventListener('click', () => closeMobileMenu({ restoreFocus: true }));
    document.addEventListener('portfolio:close-mobile-menu', () => {
        closeMobileMenu({ restoreFocus: true });
    });

    // Close menu when clicking a link
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => closeMobileMenu());
    });

    window.matchMedia('(min-width: 768px)').addEventListener?.('change', event => {
        if (event.matches) closeMobileMenu();
    });
}

// Desktop nav dropdowns + mobile nav accordions
// Desktop uses a floating flyout (pill + panel are separate cards).
function initExploreNavigation() {
    const desktopMenus = Array.from(document.querySelectorAll('[data-nav-menu]'));
    const CLOSE_GRACE_MS = 80;
    let openMenu = null;

    function getDesktopTrigger(menu) {
        return menu.querySelector('.nav-pill');
    }

    function getDesktopPanel(menu) {
        return menu.querySelector('.nav-submenu');
    }

    function setDesktopMenuState(menu, isOpen) {
        if (!menu) return;
        const trigger = getDesktopTrigger(menu);
        const panel = getDesktopPanel(menu);
        if (!trigger || !panel) return;

        menu.classList.toggle('is-open', isOpen);
        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        trigger.setAttribute('aria-expanded', String(isOpen));

        if (isOpen) {
            openMenu = menu;
        } else if (openMenu === menu) {
            openMenu = null;
        }
    }

    function closeDesktopMenu(menu) {
        setDesktopMenuState(menu, false);
    }

    function openDesktopMenu(menu) {
        if (!menu) return;
        if (openMenu && openMenu !== menu) {
            closeDesktopMenu(openMenu);
        }
        setDesktopMenuState(menu, true);
    }

    desktopMenus.forEach(menu => {
        let closeTimer = null;

        setDesktopMenuState(menu, false);

        function clearCloseTimer() {
            if (closeTimer) {
                window.clearTimeout(closeTimer);
                closeTimer = null;
            }
        }

        function queueClose() {
            clearCloseTimer();
            closeTimer = window.setTimeout(() => closeDesktopMenu(menu), CLOSE_GRACE_MS);
        }

        menu.addEventListener('mouseenter', () => {
            clearCloseTimer();
            menu.classList.remove('nav-menu--suppress-hover');
            openDesktopMenu(menu);
        });

        menu.addEventListener('mouseleave', () => {
            if (menu.classList.contains('nav-menu--suppress-hover')) return;
            queueClose();
        });
        menu.addEventListener('focusin', () => {
            clearCloseTimer();
            menu.classList.remove('nav-menu--suppress-hover');
            openDesktopMenu(menu);
        });
        menu.addEventListener('focusout', event => {
            if (!menu.contains(event.relatedTarget)) {
                queueClose();
            }
        });

        menu.querySelectorAll('.nav-submenu-link[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                clearCloseTimer();
                menu.classList.add('nav-menu--suppress-hover');
                closeDesktopMenu(menu);
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            });
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
                const navHeight = document.getElementById('nav')?.offsetHeight ?? 80;
                const targetScrollMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
                const targetOffset = Math.max(navHeight, targetScrollMargin);
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - targetOffset;

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

// Allow OTHER CHAPTERS cards to open/close from the full card surface
function initChapterDisclosures() {
    document.querySelectorAll('.chapter-disclosure').forEach(disclosure => {
        disclosure.addEventListener('click', event => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('a, button, input, textarea, select, label')) return;
            if (event.target.closest('summary')) return;

            if (!disclosure.open) {
                disclosure.setAttribute('open', '');
                return;
            }

            disclosure.removeAttribute('open');
        });

        disclosure.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !disclosure.open) return;
            disclosure.removeAttribute('open');
            disclosure.querySelector('summary')?.focus();
        });
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
    const groupStartIds = {
        portfolio: 'story',
        connect: 'connect',
        faith: 'reflections'
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
    const sectionsByGroup = Object.fromEntries(
        Object.keys(groupStartIds).map(group => [
            group,
            sections.filter(section => sectionGroups[section.id] === group)
        ])
    );
    const groupSections = Object.entries(groupStartIds)
        .map(([group, id]) => ({ group, element: document.getElementById(id) }))
        .filter(entry => entry.element)
        .sort((a, b) => a.element.offsetTop - b.element.offsetTop);
    let activeSectionId = null;
    let activeGroupId = null;
    let ticking = false;
    const activationSlack = 24;

    function getNavHeight() {
        return document.getElementById('nav')?.offsetHeight ?? 80;
    }

    function getSectionActivationTop(section) {
        if (!section) return Number.NEGATIVE_INFINITY;
        const scrollMarginTop = Number.parseFloat(window.getComputedStyle(section).scrollMarginTop) || 0;
        return Math.max(0, section.offsetTop - getNavHeight() - scrollMarginTop);
    }

    function setActiveSection(sectionId, groupId = sectionGroups[sectionId]) {
        if (!sectionId || !groupId) return;
        if (activeSectionId === sectionId && activeGroupId === groupId) return;

        activeSectionId = sectionId;
        activeGroupId = groupId;

        navLinks.forEach(link => {
            const isActive = link.dataset.navGroup === groupId;
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

        if (!sections.length || !groupSections.length) return;

        const scrollPosition = window.scrollY;
        let currentGroup = groupSections[0].group;

        groupSections.forEach(sectionEntry => {
            if (getSectionActivationTop(sectionEntry.element) <= scrollPosition + activationSlack) {
                currentGroup = sectionEntry.group;
            }
        });

        const currentGroupSections = sectionsByGroup[currentGroup] ?? [];
        let currentSection = currentGroupSections[0] ?? document.getElementById(groupStartIds[currentGroup]);

        currentGroupSections.forEach(section => {
            if (getSectionActivationTop(section) <= scrollPosition + activationSlack) {
                currentSection = section;
            }
        });

        if (currentSection) {
            setActiveSection(currentSection.id, currentGroup);
        }
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
            window.requestAnimationFrame(queueUpdate);
            window.setTimeout(queueUpdate, 180);
            window.setTimeout(queueUpdate, 360);
        });
    });

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    updateActiveSection();
}

// Swipeable portrait compare + procedural shatter easter egg
function initPortraitComparison() {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    document.querySelectorAll('[data-portrait-compare]').forEach(compare => {
        const showcase = compare.closest('[data-portrait-easter-egg]');
        const toggles = compare.parentElement?.querySelectorAll('[data-portrait-snap]') ?? [];
        const resetButton = showcase?.querySelector('[data-portrait-reset]') ?? null;
        const cracksLayer = compare.querySelector('[data-portrait-cracks]');
        const chipLayer = compare.querySelector('[data-portrait-chips]');
        const dustLayer = compare.querySelector('[data-portrait-dust]');
        const shatterLayer = compare.querySelector('[data-portrait-shatter]');
        const flashEl = compare.querySelector('.portrait-fx-flash');

        let pointerId = null;
        let isDragging = false;
        let isRevealing = false;
        let isRevealed = showcase ? showcase.classList.contains('is-revealed') : true;
        let audioContext = null;
        let revealTimerId = null;
        let rockTimerId = null;
        let settleTimerId = null;
        let tapTimerId = null;
        let clickStage = Number(showcase?.dataset.portraitClickStage ?? 0) || 0;
        let lastImpact = { xPct: 50, yPct: 38, xPx: 0, yPx: 0, w: 0, h: 0 };
        const impactHistory = [];

        function rand(min, max) {
            return min + Math.random() * (max - min);
        }

        function clamp(value, min = 0, max = 100) {
            return Math.min(max, Math.max(min, value));
        }

        function clearFxLayers() {
            if (cracksLayer) cracksLayer.innerHTML = '';
            if (chipLayer) chipLayer.innerHTML = '';
            if (dustLayer) dustLayer.innerHTML = '';
            if (shatterLayer) shatterLayer.innerHTML = '';
            flashEl?.classList.remove('is-active');
            impactHistory.length = 0;
        }

        function getImpactFromEvent(event) {
            const rect = compare.getBoundingClientRect();
            const w = rect.width || 1;
            const h = rect.height || 1;
            let xPx;
            let yPx;

            if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
                xPx = clamp(event.clientX - rect.left, 0, w);
                yPx = clamp(event.clientY - rect.top, 0, h);
            } else {
                xPx = w * 0.5;
                yPx = h * 0.38;
            }

            return {
                xPx,
                yPx,
                w,
                h,
                xPct: (xPx / w) * 100,
                yPct: (yPx / h) * 100
            };
        }

        function triggerImpactFlash(impact, strength = 1) {
            if (!flashEl || prefersReducedMotion) return;
            flashEl.classList.remove('is-active');
            flashEl.style.left = `${impact.xPct}%`;
            flashEl.style.top = `${impact.yPct}%`;
            flashEl.style.width = `${Math.round(88 * strength)}px`;
            flashEl.style.height = `${Math.round(88 * strength)}px`;
            // Force reflow so the animation restarts on rapid taps.
            void flashEl.offsetWidth;
            flashEl.classList.add('is-active');
        }

        function jaggedPolyline(x0, y0, angle, length, segments, jitter) {
            const points = [[x0, y0]];
            let x = x0;
            let y = y0;
            const step = length / segments;
            let heading = angle;

            for (let i = 0; i < segments; i += 1) {
                heading += rand(-jitter, jitter);
                x += Math.cos(heading) * step;
                y += Math.sin(heading) * step;
                // Softly keep cracks near the frame.
                x = clamp(x, -8, 108);
                y = clamp(y, -8, 108);
                points.push([x, y]);
            }

            return points;
        }

        function pointsToPath(points) {
            return points
                .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0].toFixed(2)} ${point[1].toFixed(2)}`)
                .join(' ');
        }

        function ensureCracksSvg() {
            if (!cracksLayer) return null;
            let svg = cracksLayer.querySelector('svg.portrait-cracks-svg');
            if (svg) return svg;

            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'portrait-cracks-svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.setAttribute('aria-hidden', 'true');
            cracksLayer.appendChild(svg);
            return svg;
        }

        function spawnCrackNetwork(impact, intensity = 1) {
            if (!cracksLayer || prefersReducedMotion) return;
            const svg = ensureCracksSvg();
            if (!svg) return;

            // Sparse hairline fractures — real glass reads as thin transparent lines, not ink.
            const branchCount = intensity >= 2 ? 6 : 4;
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const baseAngle = rand(0, Math.PI * 2);

            function appendGlassStroke(d, lengthHint, delay, tones) {
                tones.forEach((tone, toneIndex) => {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', d);
                    path.setAttribute('class', `portrait-crack-path ${tone}`);
                    path.style.setProperty('--portrait-crack-length', String(lengthHint));
                    path.style.strokeDasharray = `${lengthHint}`;
                    path.style.strokeDashoffset = `${lengthHint}`;
                    path.style.animationDelay = delay;
                    if (toneIndex === 1) {
                        // Tiny offset so highlight sits beside the edge, not on top of it.
                        path.style.transform = 'translate(0.12px, -0.1px)';
                    }
                    group.appendChild(path);
                });
            }

            for (let i = 0; i < branchCount; i += 1) {
                const angle = baseAngle + (i * (Math.PI * 2 / branchCount)) + rand(-0.4, 0.4);
                const length = rand(12, 22) * (0.7 + intensity * 0.22);
                const segments = 3 + Math.floor(rand(0, 2));
                const main = jaggedPolyline(impact.xPct, impact.yPct, angle, length, segments, 0.48);
                const d = pointsToPath(main);
                const delay = `${(i * 0.02).toFixed(3)}s`;
                const lengthHint = Math.round(length * 1.55);

                appendGlassStroke(d, lengthHint, delay, ['is-edge', 'is-highlight', 'is-sheen']);

                // Occasional thin side forks — keep sparse so the pane stays readable.
                if (Math.random() > 0.55) {
                    const forkFrom = main[1 + Math.floor(Math.random() * Math.max(1, main.length - 2))];
                    const forkAngle = angle + rand(-1.0, 1.0);
                    const fork = jaggedPolyline(forkFrom[0], forkFrom[1], forkAngle, length * rand(0.22, 0.42), 2, 0.55);
                    appendGlassStroke(
                        pointsToPath(fork),
                        40,
                        `${(0.06 + i * 0.02).toFixed(3)}s`,
                        ['is-edge', 'is-highlight']
                    );
                }
            }

            svg.appendChild(group);
        }

        function spawnImpactChips(impact, count) {
            if (!chipLayer || prefersReducedMotion) return;
            const { xPx, yPx, xPct, yPct } = impact;

            for (let i = 0; i < count; i += 1) {
                const size = rand(7, 16);
                const offsetX = rand(-10, 12);
                const offsetY = rand(-8, 10);
                const chipX = xPx + offsetX;
                const chipY = yPx + offsetY;
                const angle = Math.atan2(offsetY + rand(-4, 8), offsetX + rand(-6, 6));
                const distance = rand(18, 46);
                const tx = Math.cos(angle) * distance + rand(-6, 6);
                const ty = Math.sin(angle) * distance + rand(16, 42);
                const rotStart = rand(-25, 25);
                const rotEnd = rotStart + rand(40, 140) * (Math.random() > 0.5 ? 1 : -1);

                // Irregular triangle / quad clip for chips.
                const p1 = `${rand(0, 30)}% ${rand(0, 25)}%`;
                const p2 = `${rand(70, 100)}% ${rand(0, 30)}%`;
                const p3 = `${rand(60, 100)}% ${rand(70, 100)}%`;
                const p4 = `${rand(0, 35)}% ${rand(65, 100)}%`;
                const clip = Math.random() > 0.35
                    ? `polygon(${p1}, ${p2}, ${p3}, ${p4})`
                    : `polygon(${p1}, ${p2}, ${p3})`;

                const chip = document.createElement('span');
                chip.className = 'portrait-chip';
                chip.style.width = `${size}px`;
                chip.style.height = `${size * rand(0.75, 1.15)}px`;
                chip.style.clipPath = clip;
                // Cover + impact-local position so debris samples the tapped region.
                chip.style.backgroundSize = 'cover';
                chip.style.backgroundPosition = `${clamp(xPct + rand(-4, 4))}% ${clamp(yPct + rand(-4, 4))}%`;
                chip.style.setProperty('--portrait-chip-x', `${chipX}px`);
                chip.style.setProperty('--portrait-chip-y', `${chipY}px`);
                chip.style.setProperty('--portrait-chip-tx', `${chipX + tx}px`);
                chip.style.setProperty('--portrait-chip-ty', `${chipY + ty}px`);
                chip.style.setProperty('--portrait-chip-rot-start', `${rotStart}deg`);
                chip.style.setProperty('--portrait-chip-rot-end', `${rotEnd}deg`);
                chip.style.setProperty('--portrait-chip-scale-end', String(rand(0.55, 0.9)));
                chip.style.setProperty('--portrait-chip-delay', `${rand(0, 0.06).toFixed(3)}s`);
                chip.style.setProperty('--portrait-chip-duration', `${rand(0.48, 0.72).toFixed(3)}s`);
                chipLayer.appendChild(chip);

                window.setTimeout(() => chip.remove(), 900);
            }
        }

        function spawnDust(impact, count) {
            if (!dustLayer || prefersReducedMotion) return;

            for (let i = 0; i < count; i += 1) {
                const angle = rand(0, Math.PI * 2);
                const dist = rand(8, 42);
                const dust = document.createElement('span');
                dust.className = 'portrait-dust';
                dust.style.setProperty('--portrait-dust-size', `${rand(1.5, 4.2).toFixed(1)}px`);
                dust.style.setProperty('--portrait-dust-x', `${impact.xPx}px`);
                dust.style.setProperty('--portrait-dust-y', `${impact.yPx}px`);
                dust.style.setProperty('--portrait-dust-tx', `${impact.xPx + Math.cos(angle) * dist}px`);
                dust.style.setProperty('--portrait-dust-ty', `${impact.yPx + Math.sin(angle) * dist + rand(8, 26)}px`);
                dust.style.setProperty('--portrait-dust-delay', `${rand(0, 0.08).toFixed(3)}s`);
                dust.style.setProperty('--portrait-dust-duration', `${rand(0.4, 0.7).toFixed(3)}s`);
                dustLayer.appendChild(dust);
                window.setTimeout(() => dust.remove(), 850);
            }
        }

        function rayToBounds(cx, cy, angle) {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            let t = Infinity;

            if (dx > 0.00001) t = Math.min(t, (100 - cx) / dx);
            if (dx < -0.00001) t = Math.min(t, (0 - cx) / dx);
            if (dy > 0.00001) t = Math.min(t, (100 - cy) / dy);
            if (dy < -0.00001) t = Math.min(t, (0 - cy) / dy);

            if (!Number.isFinite(t) || t < 0) t = 150;
            return {
                x: clamp(cx + dx * t, 0, 100),
                y: clamp(cy + dy * t, 0, 100)
            };
        }

        function angleOf(x, y, cx, cy) {
            return Math.atan2(y - cy, x - cx);
        }

        function normalizeAngle(angle) {
            let a = angle;
            while (a <= -Math.PI) a += Math.PI * 2;
            while (a > Math.PI) a -= Math.PI * 2;
            return a;
        }

        function angleInArc(angle, start, end) {
            const a = normalizeAngle(angle - start);
            const span = normalizeAngle(end - start);
            const positiveSpan = span < 0 ? span + Math.PI * 2 : span;
            const positiveA = a < 0 ? a + Math.PI * 2 : a;
            return positiveA <= positiveSpan + 0.0001;
        }

        function buildRadialShatter(impact) {
            if (!shatterLayer) return;
            shatterLayer.innerHTML = '';

            const cx = impact.xPct;
            const cy = impact.yPct;
            const shardCount = 14 + Math.floor(rand(0, 6));
            const corners = [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
                { x: 0, y: 100 }
            ];

            // Uneven angular slices that still sum to a full circle.
            const weights = Array.from({ length: shardCount }, () => rand(0.45, 1.55));
            const weightSum = weights.reduce((sum, value) => sum + value, 0);
            const angles = [];
            let cursor = rand(-Math.PI, Math.PI);
            weights.forEach(weight => {
                cursor += (weight / weightSum) * Math.PI * 2;
                angles.push(cursor);
            });

            for (let i = 0; i < angles.length; i += 1) {
                const a0 = angles[i];
                const a1 = angles[(i + 1) % angles.length];
                const edge0 = rayToBounds(cx, cy, a0);
                const edge1 = rayToBounds(cx, cy, a1);

                // Include frame corners that sit between the two rays.
                const midCorners = corners
                    .filter(corner => angleInArc(angleOf(corner.x, corner.y, cx, cy), a0, a1))
                    .sort((left, right) => (
                        normalizeAngle(angleOf(left.x, left.y, cx, cy) - a0)
                        - normalizeAngle(angleOf(right.x, right.y, cx, cy) - a0)
                    ));

                // Slightly inset the apex so shards don't share one perfect point.
                const apexJitter = 1.2;
                const apexX = clamp(cx + rand(-apexJitter, apexJitter), 0, 100);
                const apexY = clamp(cy + rand(-apexJitter, apexJitter), 0, 100);

                const polyPoints = [
                    [apexX, apexY],
                    [edge0.x, edge0.y],
                    ...midCorners.map(corner => [corner.x, corner.y]),
                    [edge1.x, edge1.y]
                ];

                // Sample a rough centroid for flight direction.
                let sumX = 0;
                let sumY = 0;
                polyPoints.forEach(point => {
                    sumX += point[0];
                    sumY += point[1];
                });
                const centroidX = sumX / polyPoints.length;
                const centroidY = sumY / polyPoints.length;
                const dirX = centroidX - cx;
                const dirY = centroidY - cy;
                const dirLen = Math.hypot(dirX, dirY) || 1;
                const nx = dirX / dirLen;
                const ny = dirY / dirLen;

                // Explosive outward push + gravity bias.
                const blast = rand(38, 96);
                const gravity = rand(90, 210);
                const spin = rand(-48, 48) + nx * 18;
                const scaleEnd = rand(0.86, 1.04);
                const delay = rand(0.02, 0.18);
                const duration = rand(0.78, 1.12);

                const clip = `polygon(${polyPoints.map(point => `${point[0].toFixed(2)}% ${point[1].toFixed(2)}%`).join(', ')})`;
                const piece = document.createElement('span');
                piece.className = 'portrait-shatter-piece is-flying';
                piece.style.clipPath = clip;
                piece.style.setProperty('--portrait-shard-origin-x', `${cx}%`);
                piece.style.setProperty('--portrait-shard-origin-y', `${cy}%`);
                piece.style.setProperty('--portrait-shard-delay', `${delay.toFixed(3)}s`);
                piece.style.setProperty('--portrait-shard-duration', `${duration.toFixed(3)}s`);
                piece.style.setProperty(
                    '--portrait-shard-fall-transform',
                    `translate3d(${(nx * blast + rand(-12, 12)).toFixed(1)}px, ${(ny * blast * 0.55 + gravity).toFixed(1)}px, 0) rotate(${spin.toFixed(1)}deg) scale(${scaleEnd.toFixed(3)})`
                );
                // Slight z-order chaos so overlapping shards feel dimensional.
                piece.style.zIndex = String(1 + Math.floor(rand(0, 8)));
                shatterLayer.appendChild(piece);
            }
        }

        function revealEasterEgg(impact) {
            if (isRevealed || isRevealing) return;
            isRevealing = true;
            showcase?.classList.add('is-revealing');
            compare.setAttribute('aria-busy', 'true');
            compare.setAttribute('aria-expanded', 'false');

            const shatterImpact = impact || lastImpact;
            if (!prefersReducedMotion) {
                buildRadialShatter(shatterImpact);
                spawnDust(shatterImpact, 18);
            }

            const settleMs = prefersReducedMotion ? 120 : 1180;

            revealTimerId = window.setTimeout(() => {
                isRevealing = false;
                isRevealed = true;
                clickStage = 0;
                showcase?.classList.remove('is-revealing');
                showcase?.classList.add('is-revealed');
                showcase?.removeAttribute('data-portrait-click-stage');
                showcase?.removeAttribute('data-portrait-rock');
                showcase?.removeAttribute('data-portrait-tap');
                compare.removeAttribute('role');
                compare.removeAttribute('aria-busy');
                compare.setAttribute('aria-label', 'Swipeable portrait comparison between the polished portrait and the original photo');
                compare.setAttribute('aria-expanded', 'true');
                if (shatterLayer) shatterLayer.innerHTML = '';
                if (cracksLayer) cracksLayer.innerHTML = '';
                if (chipLayer) chipLayer.innerHTML = '';
                if (dustLayer) dustLayer.innerHTML = '';
                compare.classList.add('is-settling');
                window.requestAnimationFrame(() => {
                    setReveal(50);
                });
                settleTimerId = window.setTimeout(() => {
                    compare.classList.remove('is-settling');
                    settleTimerId = null;
                }, 380);
                revealTimerId = null;
            }, settleMs);
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

        function clearSettleTimer() {
            if (settleTimerId === null) return;
            window.clearTimeout(settleTimerId);
            settleTimerId = null;
        }

        function clearTapTimer() {
            if (tapTimerId === null) return;
            window.clearTimeout(tapTimerId);
            tapTimerId = null;
        }

        function ensureAudioContext() {
            if (typeof window === 'undefined') return null;
            if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return null;

            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return null;

            if (!audioContext) {
                audioContext = new AudioContextCtor();
            }
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
            return audioContext;
        }

        function createNoiseBuffer(ctx, durationSec, color = 'white') {
            const length = Math.max(1, Math.ceil(ctx.sampleRate * durationSec));
            const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let brown = 0;
            let pink0 = 0;
            let pink1 = 0;
            let pink2 = 0;

            for (let i = 0; i < length; i += 1) {
                const white = Math.random() * 2 - 1;
                if (color === 'brown') {
                    brown = (brown + (0.02 * white)) / 1.02;
                    data[i] = brown * 3.5;
                } else if (color === 'pink') {
                    pink0 = (0.99886 * pink0) + (white * 0.0555179);
                    pink1 = (0.99332 * pink1) + (white * 0.0750759);
                    pink2 = (0.96900 * pink2) + (white * 0.1538520);
                    data[i] = (pink0 + pink1 + pink2 + (white * 0.1848)) * 0.33;
                } else {
                    data[i] = white;
                }
            }
            return buffer;
        }

        function playTone(ctx, destination, {
            type = 'sine',
            frequency,
            endFrequency,
            when,
            duration,
            peak = 0.04,
            attack = 0.004,
            detune = 0
        }) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, when);
            if (typeof endFrequency === 'number') {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), when + duration);
            }
            if (detune) osc.detune.setValueAtTime(detune, when);
            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
            osc.connect(gain);
            gain.connect(destination);
            osc.start(when);
            osc.stop(when + duration + 0.02);
        }

        function createMasterBus(ctx) {
            const master = ctx.createGain();
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-18, ctx.currentTime);
            compressor.knee.setValueAtTime(18, ctx.currentTime);
            compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
            compressor.attack.setValueAtTime(0.003, ctx.currentTime);
            compressor.release.setValueAtTime(0.14, ctx.currentTime);
            master.gain.value = 0.9;
            master.connect(compressor);
            compressor.connect(ctx.destination);
            return master;
        }

        // Layered procedural glass: soft tick → hard crack → full shatter cascade.
        function playGlassSound(kind = 'soft') {
            const ctx = ensureAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime + 0.01;
            const master = createMasterBus(ctx);

            if (kind === 'soft') {
                // Thin glass tick — high, short, almost delicate.
                const transient = createNoiseBuffer(ctx, 0.045, 'white');
                const crackle = createNoiseBuffer(ctx, 0.12, 'pink');

                const hp = ctx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 1800;
                hp.Q.value = 0.7;

                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 4200;
                bp.Q.value = 1.1;

                const tGain = ctx.createGain();
                tGain.gain.setValueAtTime(0.0001, now);
                tGain.gain.exponentialRampToValueAtTime(0.16, now + 0.003);
                tGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

                const tSrc = ctx.createBufferSource();
                tSrc.buffer = transient;
                tSrc.connect(hp);
                hp.connect(bp);
                bp.connect(tGain);
                tGain.connect(master);
                tSrc.start(now);
                tSrc.stop(now + 0.06);

                const cHp = ctx.createBiquadFilter();
                cHp.type = 'highpass';
                cHp.frequency.value = 1200;
                const cGain = ctx.createGain();
                cGain.gain.setValueAtTime(0.0001, now);
                cGain.gain.exponentialRampToValueAtTime(0.04, now + 0.008);
                cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
                const cSrc = ctx.createBufferSource();
                cSrc.buffer = crackle;
                cSrc.playbackRate.value = 1.15;
                cSrc.connect(cHp);
                cHp.connect(cGain);
                cGain.connect(master);
                cSrc.start(now);
                cSrc.stop(now + 0.12);

                // Quiet crystalline ring.
                playTone(ctx, master, {
                    type: 'sine',
                    frequency: 2650 + rand(-80, 120),
                    endFrequency: 1480,
                    when: now,
                    duration: 0.22,
                    peak: 0.018,
                    attack: 0.002
                });
                playTone(ctx, master, {
                    type: 'triangle',
                    frequency: 980 + rand(-40, 40),
                    endFrequency: 520,
                    when: now + 0.004,
                    duration: 0.16,
                    peak: 0.01,
                    attack: 0.003
                });
                return;
            }

            if (kind === 'hard') {
                // Deeper impact + spidering glass.
                const impact = createNoiseBuffer(ctx, 0.08, 'brown');
                const shard = createNoiseBuffer(ctx, 0.28, 'pink');
                const dust = createNoiseBuffer(ctx, 0.18, 'white');

                const impactLp = ctx.createBiquadFilter();
                impactLp.type = 'lowpass';
                impactLp.frequency.value = 900;
                impactLp.Q.value = 0.8;
                const impactGain = ctx.createGain();
                impactGain.gain.setValueAtTime(0.0001, now);
                impactGain.gain.exponentialRampToValueAtTime(0.22, now + 0.004);
                impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                const impactSrc = ctx.createBufferSource();
                impactSrc.buffer = impact;
                impactSrc.connect(impactLp);
                impactLp.connect(impactGain);
                impactGain.connect(master);
                impactSrc.start(now);
                impactSrc.stop(now + 0.14);

                const shardBp = ctx.createBiquadFilter();
                shardBp.type = 'bandpass';
                shardBp.frequency.setValueAtTime(2400, now);
                shardBp.frequency.exponentialRampToValueAtTime(1100, now + 0.22);
                shardBp.Q.value = 0.9;
                const shardHp = ctx.createBiquadFilter();
                shardHp.type = 'highpass';
                shardHp.frequency.value = 450;
                const shardGain = ctx.createGain();
                shardGain.gain.setValueAtTime(0.0001, now);
                shardGain.gain.exponentialRampToValueAtTime(0.13, now + 0.01);
                shardGain.gain.exponentialRampToValueAtTime(0.02, now + 0.12);
                shardGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                const shardSrc = ctx.createBufferSource();
                shardSrc.buffer = shard;
                shardSrc.playbackRate.value = 0.92 + rand(0, 0.12);
                shardSrc.connect(shardHp);
                shardHp.connect(shardBp);
                shardBp.connect(shardGain);
                shardGain.connect(master);
                shardSrc.start(now);
                shardSrc.stop(now + 0.3);

                // Secondary micro-crack a few ms later.
                const dustHp = ctx.createBiquadFilter();
                dustHp.type = 'highpass';
                dustHp.frequency.value = 2200;
                const dustGain = ctx.createGain();
                dustGain.gain.setValueAtTime(0.0001, now + 0.028);
                dustGain.gain.exponentialRampToValueAtTime(0.07, now + 0.034);
                dustGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
                const dustSrc = ctx.createBufferSource();
                dustSrc.buffer = dust;
                dustSrc.playbackRate.value = 1.35;
                dustSrc.connect(dustHp);
                dustHp.connect(dustGain);
                dustGain.connect(master);
                dustSrc.start(now + 0.028);
                dustSrc.stop(now + 0.18);

                playTone(ctx, master, {
                    type: 'triangle',
                    frequency: 210 + rand(-20, 20),
                    endFrequency: 78,
                    when: now,
                    duration: 0.28,
                    peak: 0.045,
                    attack: 0.003
                });
                playTone(ctx, master, {
                    type: 'sine',
                    frequency: 1680 + rand(-100, 100),
                    endFrequency: 640,
                    when: now + 0.006,
                    duration: 0.24,
                    peak: 0.028,
                    attack: 0.002
                });
                playTone(ctx, master, {
                    type: 'sine',
                    frequency: 3200 + rand(-150, 150),
                    endFrequency: 1400,
                    when: now + 0.01,
                    duration: 0.18,
                    peak: 0.014,
                    attack: 0.002
                });
                return;
            }

            // Full shatter — impact, cascading shards, falling debris.
            const body = createNoiseBuffer(ctx, 0.55, 'pink');
            const thrash = createNoiseBuffer(ctx, 0.4, 'white');
            const boom = createNoiseBuffer(ctx, 0.35, 'brown');

            const boomLp = ctx.createBiquadFilter();
            boomLp.type = 'lowpass';
            boomLp.frequency.value = 280;
            const boomGain = ctx.createGain();
            boomGain.gain.setValueAtTime(0.0001, now);
            boomGain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
            boomGain.gain.exponentialRampToValueAtTime(0.04, now + 0.16);
            boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
            const boomSrc = ctx.createBufferSource();
            boomSrc.buffer = boom;
            boomSrc.connect(boomLp);
            boomLp.connect(boomGain);
            boomGain.connect(master);
            boomSrc.start(now);
            boomSrc.stop(now + 0.45);

            const bodyBp = ctx.createBiquadFilter();
            bodyBp.type = 'bandpass';
            bodyBp.frequency.setValueAtTime(1800, now);
            bodyBp.frequency.exponentialRampToValueAtTime(520, now + 0.45);
            bodyBp.Q.value = 0.65;
            const bodyGain = ctx.createGain();
            bodyGain.gain.setValueAtTime(0.0001, now);
            bodyGain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
            bodyGain.gain.exponentialRampToValueAtTime(0.05, now + 0.22);
            bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
            const bodySrc = ctx.createBufferSource();
            bodySrc.buffer = body;
            bodySrc.playbackRate.value = 0.88;
            bodySrc.connect(bodyBp);
            bodyBp.connect(bodyGain);
            bodyGain.connect(master);
            bodySrc.start(now);
            bodySrc.stop(now + 0.58);

            // Cascading glass bursts.
            for (let i = 0; i < 5; i += 1) {
                const t = now + 0.02 + (i * 0.038) + rand(0, 0.012);
                const rate = 1.05 + (i * 0.12) + rand(0, 0.08);
                const peak = 0.09 - (i * 0.012);
                const burstHp = ctx.createBiquadFilter();
                burstHp.type = 'highpass';
                burstHp.frequency.value = 1400 + (i * 380);
                const burstBp = ctx.createBiquadFilter();
                burstBp.type = 'bandpass';
                burstBp.frequency.value = 2800 + (i * 420);
                burstBp.Q.value = 1.2;
                const burstGain = ctx.createGain();
                burstGain.gain.setValueAtTime(0.0001, t);
                burstGain.gain.exponentialRampToValueAtTime(Math.max(0.012, peak), t + 0.004);
                burstGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11 + rand(0, 0.04));
                const burstSrc = ctx.createBufferSource();
                burstSrc.buffer = thrash;
                burstSrc.playbackRate.value = rate;
                burstSrc.connect(burstHp);
                burstHp.connect(burstBp);
                burstBp.connect(burstGain);
                burstGain.connect(master);
                burstSrc.start(t);
                burstSrc.stop(t + 0.2);
            }

            // Falling debris tail.
            const tailHp = ctx.createBiquadFilter();
            tailHp.type = 'highpass';
            tailHp.frequency.value = 900;
            const tailGain = ctx.createGain();
            tailGain.gain.setValueAtTime(0.0001, now + 0.12);
            tailGain.gain.exponentialRampToValueAtTime(0.045, now + 0.18);
            tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
            const tailSrc = ctx.createBufferSource();
            tailSrc.buffer = thrash;
            tailSrc.playbackRate.value = 0.72;
            tailSrc.connect(tailHp);
            tailHp.connect(tailGain);
            tailGain.connect(master);
            tailSrc.start(now + 0.12);
            tailSrc.stop(now + 0.75);

            playTone(ctx, master, {
                type: 'sine',
                frequency: 92,
                endFrequency: 48,
                when: now,
                duration: 0.4,
                peak: 0.06,
                attack: 0.004
            });
            playTone(ctx, master, {
                type: 'triangle',
                frequency: 340,
                endFrequency: 110,
                when: now + 0.01,
                duration: 0.35,
                peak: 0.035,
                attack: 0.003
            });
            playTone(ctx, master, {
                type: 'sine',
                frequency: 2400 + rand(-200, 200),
                endFrequency: 900,
                when: now + 0.015,
                duration: 0.32,
                peak: 0.03,
                attack: 0.002
            });
            playTone(ctx, master, {
                type: 'sine',
                frequency: 4100 + rand(-250, 250),
                endFrequency: 1600,
                when: now + 0.04,
                duration: 0.28,
                peak: 0.016,
                attack: 0.002
            });
        }

        function triggerHaptics(kind) {
            if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
            if (kind === 'soft') {
                navigator.vibrate(12);
            } else if (kind === 'hard') {
                navigator.vibrate([14, 24, 18]);
            } else {
                navigator.vibrate([18, 30, 16, 28, 40]);
            }
        }

        function triggerTapFeedback(level) {
            if (!showcase) return;
            clearTapTimer();
            showcase.dataset.portraitTap = level;
            tapTimerId = window.setTimeout(() => {
                showcase.removeAttribute('data-portrait-tap');
                tapTimerId = null;
            }, level === 'shatter' ? 280 : level === 'hard' ? 220 : 180);

            try {
                triggerHaptics(level);
            } catch {
                // Ignore haptic failures.
            }

            try {
                playGlassSound(level === 'shatter' ? 'shatter' : level === 'hard' ? 'hard' : 'soft');
            } catch {
                // Ignore audio failures; visual feedback still runs.
            }
        }

        function animateRevealTo(target, duration = 240) {
            clearSettleTimer();
            compare.classList.add('is-settling');
            setReveal(target);
            settleTimerId = window.setTimeout(() => {
                compare.classList.remove('is-settling');
                settleTimerId = null;
            }, duration);
        }

        function resetPortraitExperience() {
            clearRevealTimer();
            clearRockTimer();
            clearSettleTimer();
            clearTapTimer();
            stopDragging();
            clearFxLayers();

            isRevealing = false;
            isRevealed = false;
            clickStage = 0;
            lastImpact = { xPct: 50, yPct: 38, xPx: 0, yPx: 0, w: 0, h: 0 };

            showcase?.classList.remove('is-revealing', 'is-revealed');
            showcase?.removeAttribute('data-portrait-click-stage');
            showcase?.removeAttribute('data-portrait-rock');
            showcase?.removeAttribute('data-portrait-tap');

            compare.classList.remove('is-settling');
            compare.setAttribute('role', 'button');
            compare.removeAttribute('aria-busy');
            compare.setAttribute('aria-label', 'Portrait of Alphaeus Ng');
            compare.setAttribute('aria-expanded', 'false');
            if (resetButton) {
                resetButton.textContent = 'Again?';
            }
            setReveal(100);
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
            showcase.dataset.portraitClickStage = String(Math.min(clickStage, 3));
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

        function handleHiddenClick(event) {
            if (isRevealed || isRevealing) return;

            const impact = getImpactFromEvent(event);
            lastImpact = impact;
            impactHistory.push(impact);

            clickStage = Math.min(clickStage + 1, 3);
            syncClickStage();

            if (clickStage === 1) {
                triggerTapFeedback('soft');
                triggerRock('soft');
                triggerImpactFlash(impact, 0.75);
                spawnCrackNetwork(impact, 1);
                spawnImpactChips(impact, 5);
                spawnDust(impact, 7);
                return;
            }

            if (clickStage === 2) {
                triggerTapFeedback('hard');
                triggerRock('hard');
                triggerImpactFlash(impact, 1);
                spawnCrackNetwork(impact, 2);
                spawnImpactChips(impact, 9);
                spawnDust(impact, 12);
                return;
            }

            // Final impact: denser local debris, then full shatter reveal.
            triggerTapFeedback('shatter');
            triggerRock('hard');
            triggerImpactFlash(impact, 1.25);
            spawnCrackNetwork(impact, 2.4);
            spawnImpactChips(impact, 12);
            spawnDust(impact, 16);
            revealEasterEgg(impact);
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
                animateRevealTo(Number(toggle.dataset.portraitSnap), 230);
            });
        });

        resetButton?.addEventListener('click', () => {
            resetPortraitExperience();
        });

        syncRevealState();
        syncClickStage();

        setReveal(Number.parseFloat(compare.style.getPropertyValue('--portrait-reveal')) || 100);

        window.addEventListener('beforeunload', clearRevealTimer, { once: true });
        window.addEventListener('beforeunload', clearRockTimer, { once: true });
        window.addEventListener('beforeunload', clearSettleTimer, { once: true });
        window.addEventListener('beforeunload', clearTapTimer, { once: true });
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
                if (menu && !menu.classList.contains('hidden')) {
                    document.dispatchEvent(new CustomEvent('portfolio:close-mobile-menu'));
                }
                document.querySelectorAll('[data-nav-menu]').forEach(menuGroup => {
                    const panel = menuGroup.querySelector('.nav-submenu');
                    menuGroup.classList.remove('is-open');
                    panel?.classList.remove('is-open');
                    panel?.setAttribute('aria-hidden', 'true');
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

function initArcadePrefetch() {
    // Warm the arcade shell when a user shows intent — project page is separate.
    const links = document.querySelectorAll('a[href*="AlpArcade"]');
    if (!links.length) return;
    let done = false;
    const warm = () => {
        if (done) return;
        done = true;
        const tip = document.createElement('link');
        tip.rel = 'prefetch';
        tip.href = 'https://alphaeusng.github.io/AlpArcade/';
        tip.as = 'document';
        document.head.appendChild(tip);
    };
    links.forEach((a) => {
        a.addEventListener('pointerenter', warm, { once: true });
        a.addEventListener('focus', warm, { once: true });
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
    initChapterDisclosures();
    initActiveNav();
    initPortraitComparison();
    initAccessibility();
    initArcadePrefetch();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
