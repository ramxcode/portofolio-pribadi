// Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// FAQ Accordion Toggle
const faqToggles = document.querySelectorAll('.faq-toggle');
faqToggles.forEach(btn => {
    btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('i');
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });
});

// Contact Form Submission Simulation (No alert used)
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formMessage.classList.remove('hidden');
    contactForm.reset();
    setTimeout(() => {
        formMessage.classList.add('hidden');
    }, 5000);
});

// ── Clean URL Navigation (History API) ─────────────────────────────────────
// Convert anchor section links to clean URLs: /home, /about, etc.
(function () {
    // Map section id → clean path
    var sectionPaths = {
        'home':     '/',
        'about':    '/about',
        'services': '/services',
        'projects': '/projects',
        'faq':      '/faq',
        'contact':  '/contact',
    };

    // Update URL bar using pushState when section comes into view
    var sections = document.querySelectorAll('section[id]');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var id   = entry.target.getAttribute('id');
                var path = sectionPaths[id] || ('/' + id);
                if (window.location.pathname !== path) {
                    history.replaceState(null, '', path);
                }
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(function (sec) { observer.observe(sec); });

    // Handle nav link clicks with [data-section] — scroll smoothly, update URL
    document.querySelectorAll('a[data-section]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var sectionId = this.getAttribute('data-section');
            var target    = document.getElementById(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            var path = sectionPaths[sectionId] || ('/' + sectionId);
            history.pushState(null, '', path);

            // Close mobile menu if open
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // On page load: if path matches a section, scroll to it
    var initPath = window.location.pathname.replace(/^\//, '') || 'home';
    var initSection = document.getElementById(initPath);
    if (initSection) {
        setTimeout(function () {
            initSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
})();

// -- Dark Mode Toggle --------------------------------------------------
(function () {
    var THEME_KEY = 'ramxcode_theme';
    var html = document.documentElement;

    function isDark() { return html.classList.contains('dark'); }

    function applyTheme(dark) {
        if (dark) {
            html.classList.add('dark');
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem(THEME_KEY, 'light');
        }
        updateIcons(dark);
        updateMobileBtn(dark);
    }

    function updateIcons(dark) {
        var icon = document.getElementById('theme-icon');
        if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    function updateMobileBtn(dark) {
        var btn  = document.getElementById('theme-toggle-mobile');
        var icon = document.getElementById('theme-icon-mobile');
        if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        if (btn) {
            btn.style.backgroundColor = dark ? '#1e293b' : '#f1f5f9';
            btn.style.color           = dark ? '#fbbf24' : '#475569';
        }
    }

    // Sync icon dengan state saat ini
    updateIcons(isDark());
    updateMobileBtn(isDark());

    var toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () { applyTheme(!isDark()); });
    }

    var toggleBtnMobile = document.getElementById('theme-toggle-mobile');
    if (toggleBtnMobile) {
        toggleBtnMobile.addEventListener('click', function () { applyTheme(!isDark()); });
    }
})();
