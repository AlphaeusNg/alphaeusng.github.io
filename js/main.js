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

    function resetMobileExplorePanel() {
        const exploreBtn = document.getElementById('mobile-explore-btn');
        const explorePanel = document.getElementById('mobile-explore-panel');
        const icon = exploreBtn?.querySelector('svg');

        if (!exploreBtn || !explorePanel) return;
        explorePanel.classList.add('hidden');
        exploreBtn.setAttribute('aria-expanded', 'false');
        icon?.classList.remove('rotate-180');
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
            resetMobileExplorePanel();
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
            resetMobileExplorePanel();
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
        });
    });
}

// Desktop Explore dropdown + mobile Explore accordion
function initExploreNavigation() {
    const wrapper = document.getElementById('explore-wrapper');
    const btn = document.getElementById('explore-btn');
    const menu = document.getElementById('explore-dropdown');
    const mobileBtn = document.getElementById('mobile-explore-btn');
    const mobilePanel = document.getElementById('mobile-explore-panel');

    if (wrapper && btn && menu) {
        const icon = btn.querySelector('svg');
        let closeTimer;

        function openDesktopExplore() {
            window.clearTimeout(closeTimer);
            menu.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
            icon?.classList.add('rotate-180');
        }

        function closeDesktopExplore() {
            window.clearTimeout(closeTimer);
            menu.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
            icon?.classList.remove('rotate-180');
        }

        function queueCloseDesktopExplore() {
            window.clearTimeout(closeTimer);
            closeTimer = window.setTimeout(closeDesktopExplore, 90);
        }

        wrapper.addEventListener('mouseenter', openDesktopExplore);
        wrapper.addEventListener('mouseleave', queueCloseDesktopExplore);
        wrapper.addEventListener('focusin', openDesktopExplore);
        wrapper.addEventListener('focusout', (event) => {
            if (!wrapper.contains(event.relatedTarget)) {
                closeDesktopExplore();
            }
        });

        btn.addEventListener('click', (event) => {
            event.preventDefault();
            if (menu.classList.contains('hidden')) {
                openDesktopExplore();
            } else {
                closeDesktopExplore();
            }
        });

        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) {
                closeDesktopExplore();
            }
        });
    }

    if (mobileBtn && mobilePanel) {
        const mobileIcon = mobileBtn.querySelector('svg');

        mobileBtn.addEventListener('click', () => {
            const willOpen = mobilePanel.classList.contains('hidden');
            mobilePanel.classList.toggle('hidden');
            mobileBtn.setAttribute('aria-expanded', String(willOpen));
            mobileIcon?.classList.toggle('rotate-180', willOpen);
        });
    }
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
    const sections = ['story', 'journey', 'craft', 'thoughts', 'reflections'];
    const navLinks = document.querySelectorAll('#nav .nav-link[href^="#"]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                
                navLinks.forEach(link => {
                    link.classList.remove('active', 'text-white');
                    link.classList.add('text-[#CBD5E1]');
                    
                    if (link.getAttribute('href') === `#${id}`) {
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

    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
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
                const mobileExploreBtn = document.getElementById('mobile-explore-btn');
                const mobileExplorePanel = document.getElementById('mobile-explore-panel');
                const mobileExploreIcon = mobileExploreBtn?.querySelector('svg');
                if (menu && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                    if (mobileExploreBtn && mobileExplorePanel) {
                        mobileExplorePanel.classList.add('hidden');
                        mobileExploreBtn.setAttribute('aria-expanded', 'false');
                        mobileExploreIcon?.classList.remove('rotate-180');
                    }
                    if (btn) {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        `;
                    }
                }

                const exploreBtn = document.getElementById('explore-btn');
                const exploreDropdown = document.getElementById('explore-dropdown');
                const exploreIcon = exploreBtn?.querySelector('svg');
                if (exploreBtn && exploreDropdown && !exploreDropdown.classList.contains('hidden')) {
                    exploreDropdown.classList.add('hidden');
                    exploreBtn.setAttribute('aria-expanded', 'false');
                    exploreIcon?.classList.remove('rotate-180');
                }
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
    initAccessibility();
    
    console.log('%c[Alphaeus Ng Portfolio] Main JS initialized. Structured & cleaned.', 'color:#475569;font-size:9px');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
