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
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
        });
    });
}

function initExploreMenus() {
    const wrapper = document.getElementById('explore-wrapper');
    const btn = document.getElementById('explore-btn');
    const dropdown = document.getElementById('explore-dropdown');
    const mobileBtn = document.getElementById('mobile-explore-btn');
    const mobilePanel = document.getElementById('mobile-explore-panel');

    function setDesktopOpen(open) {
        if (!btn || !dropdown) return;
        dropdown.classList.toggle('hidden', !open);
        btn.setAttribute('aria-expanded', String(open));
        const icon = btn.querySelector('svg');
        if (icon) icon.classList.toggle('rotate-180', open);
    }

    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setDesktopOpen(dropdown.classList.contains('hidden'));
        });

        dropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setDesktopOpen(false));
        });

        document.addEventListener('click', (e) => {
            if (wrapper && !wrapper.contains(e.target)) setDesktopOpen(false);
        });
    }

    if (mobileBtn && mobilePanel) {
        mobileBtn.addEventListener('click', () => {
            const open = mobilePanel.classList.contains('hidden');
            mobilePanel.classList.toggle('hidden', !open);
            mobileBtn.setAttribute('aria-expanded', String(open));
            const icon = mobileBtn.querySelector('svg');
            if (icon) icon.classList.toggle('rotate-180', open);
        });
    }
}

function initReflectionsFilter() {
    const chips = document.querySelectorAll('.filter-chip[data-filter]');
    const items = document.querySelectorAll('#reflections-list .reflection-item');
    const clear = document.getElementById('reflections-clear');
    if (!chips.length || !items.length) return;

    function countFor(filter) {
        if (filter === 'all') return items.length;
        return Array.from(items).filter(item => item.dataset.category === filter).length;
    }

    chips.forEach(chip => {
        const count = chip.querySelector('.count');
        if (count) count.textContent = ` (${countFor(chip.dataset.filter)})`;
    });

    function applyFilter(filter) {
        chips.forEach(chip => chip.classList.toggle('active', chip.dataset.filter === filter));
        items.forEach(item => {
            item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
    });

    if (clear) clear.addEventListener('click', () => applyFilter('all'));
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
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

    document.querySelectorAll('#story .prose-elegant, #journey .timeline-item, #craft .card, #reflections > div, #intersection .vignette-card').forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = (index * 60) + 'ms';
        observer.observe(el);
    });
}

// Active nav link highlighting
function initActiveNav() {
    const sections = ['story', 'journey', 'craft', 'intersection', 'reflections'];
    const navLinks = document.querySelectorAll('#nav a[href^="#"]');
    
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
                if (menu && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                    if (btn) {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        `;
                    }
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
    initExploreMenus();
    initReflectionsFilter();
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
