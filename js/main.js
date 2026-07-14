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

        function playCrackTap(level) {
            if (typeof window === 'undefined') return;
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return;

            if (!audioContext) {
                audioContext = new AudioContextCtor();
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }

            const now = audioContext.currentTime;
            const levelScale = level === 'hard' ? 1 : 0.74;
            const duration = level === 'hard' ? 0.34 : 0.26;
            const master = audioContext.createGain();
            const stressGain = audioContext.createGain();
            const noiseGain = audioContext.createGain();
            const lowPass = audioContext.createBiquadFilter();
            const highPass = audioContext.createBiquadFilter();
            const stressOsc = audioContext.createOscillator();
            const stressOscUpper = audioContext.createOscillator();
            const sampleRate = audioContext.sampleRate;
            const buffer = audioContext.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
            const channel = buffer.getChannelData(0);
            let previousSample = 0;

            for (let index = 0; index < channel.length; index += 1) {
                const progress = index / channel.length;
                const roughNoise = (Math.random() * 2 - 1) * (1 - progress);
                previousSample = (previousSample * 0.74) + (roughNoise * 0.26);
                channel[index] = previousSample * (0.85 - (progress * 0.3));
            }

            const noiseSource = audioContext.createBufferSource();
            noiseSource.buffer = buffer;

            lowPass.type = 'lowpass';
            lowPass.frequency.setValueAtTime(level === 'hard' ? 1380 : 1120, now);
            lowPass.Q.setValueAtTime(0.8, now);

            highPass.type = 'highpass';
            highPass.frequency.setValueAtTime(level === 'hard' ? 210 : 170, now);
            highPass.Q.setValueAtTime(0.7, now);

            master.gain.setValueAtTime(0.0001, now);
            master.gain.exponentialRampToValueAtTime(0.11 * levelScale, now + 0.016);
            master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            noiseGain.gain.setValueAtTime(0.0001, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.095 * levelScale, now + 0.02);
            noiseGain.gain.exponentialRampToValueAtTime(0.012 * levelScale, now + (duration * 0.52));
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            stressGain.gain.setValueAtTime(0.0001, now);
            stressGain.gain.exponentialRampToValueAtTime(0.032 * levelScale, now + 0.02);
            stressGain.gain.exponentialRampToValueAtTime(0.0032 * levelScale, now + (duration * 0.72));
            stressGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            stressOsc.type = 'triangle';
            stressOsc.frequency.setValueAtTime(level === 'hard' ? 182 : 148, now);
            stressOsc.frequency.exponentialRampToValueAtTime(level === 'hard' ? 76 : 62, now + duration);

            stressOscUpper.type = 'sine';
            stressOscUpper.frequency.setValueAtTime(level === 'hard' ? 328 : 272, now);
            stressOscUpper.frequency.exponentialRampToValueAtTime(level === 'hard' ? 118 : 102, now + (duration * 0.84));

            noiseSource.connect(lowPass);
            lowPass.connect(highPass);
            highPass.connect(noiseGain);
            noiseGain.connect(master);

            stressOsc.connect(stressGain);
            stressOscUpper.connect(stressGain);
            stressGain.connect(master);

            master.connect(audioContext.destination);

            noiseSource.start(now);
            noiseSource.stop(now + duration);
            stressOsc.start(now);
            stressOscUpper.start(now + 0.01);
            stressOsc.stop(now + duration);
            stressOscUpper.stop(now + (duration * 0.86));
        }

        function triggerTapFeedback(level) {
            if (!showcase) return;
            clearTapTimer();
            showcase.dataset.portraitTap = level;
            tapTimerId = window.setTimeout(() => {
                showcase.removeAttribute('data-portrait-tap');
                tapTimerId = null;
            }, level === 'hard' ? 220 : 180);

            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(level === 'hard' ? [10, 18, 12] : 10);
            }

            try {
                playCrackTap(level);
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
            triggerTapFeedback('hard');
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
    
    console.log('%c[Alphaeus Ng Portfolio] Main JS initialized. Structured & cleaned.', 'color:#475569;font-size:9px');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
