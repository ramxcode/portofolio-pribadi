/**
 * settings.js — Portfolio Settings Loader
 *
 * Strategi 2 langkah:
 * 1. Terapkan dari localStorage segera (sinkron, tidak ada delay)
 * 2. Ambil dari database API jika dikonfigurasi (async, update di background)
 */
(function () {
    'use strict';

    var STORAGE_KEY   = 'ramxcode_portfolio_settings';
    var PROJECTS_KEY  = 'ramxcode_portfolio_projects';
    var API_URL_KEY   = 'ramxcode_api_url';

    var DEFAULTS = {
        brandName:            'RAMXCODE',
        brandMode:            'text',          // 'text' | 'logo'
        brandLogoUrl:         'logo.png',
        footerBrand:          '',              // kosong = tidak tampil
        footerMode:           'hidden',        // 'text' | 'logo' | 'hidden'
        footerLogoUrl:        'logo.png',
        footerCopyright:      '\u00A9 2026 RAMXCODE. All Right Reserved.',
        pageTitle:            'M Ikram - Portofolio',
        heroRole:             'Frontend Developer & UI/UX Enthusiast',
        heroHeading:          'Membangun Pengalaman Digital yang ',
        heroHeadingHighlight: 'Interaktif & Modern',
        heroName:             'M Ikram',
        heroDescription:      'Saya membantu mengubah ide kreatif menjadi antarmuka web yang bersih, responsif, berkinerja tinggi, dan memukau.',
        profileImage:         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
        availabilityText:     'Tersedia untuk Freelance',
        availabilitySubtext:  'Siap mengerjakan proyek baru',
        aboutDescription:     'Saya adalah seorang Frontend Developer yang berfokus pada pembuatan pengalaman web yang interaktif, cepat, dan ramah pengguna. Dengan pengalaman mendalam di bidang teknologi web modern, saya selalu memastikan setiap baris kode yang ditulis efisien dan mudah dikembangkan.',
        statYears:            '3+',
        statProjects:         '45+',
        statClients:          '100%',
        contactEmail:         'ramzneverrlus@gmail.com',
        contactPhone:         '+6287779401899',
        contactLocation:      'Medan, Indonesia',
        socialGithub:         '#',
        socialLinkedin:       '#',
        socialInstagram:      '#',
        socialTwitter:        '#',
    };

    /* ------------------------------------------------------------------ */
    /* Helpers                                                              */
    /* ------------------------------------------------------------------ */

    function getLocalSettings() {
        try {
            var saved  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            var result = {};
            for (var key in DEFAULTS) {
                if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
                    // For fields that can intentionally be empty string, don't fallback
                    var noFallback = ['footerBrand'];
                    if (noFallback.indexOf(key) >= 0) {
                        result[key] = (saved[key] !== undefined && saved[key] !== null) ? saved[key] : DEFAULTS[key];
                    } else {
                        result[key] = (saved[key] && saved[key].trim() !== '')
                            ? saved[key]
                            : DEFAULTS[key];
                    }
                }
            }
            return result;
        } catch (e) {
            var copy = {};
            for (var k in DEFAULTS) { copy[k] = DEFAULTS[k]; }
            return copy;
        }
    }

    function getLocalProjects() {
        try {
            return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el && value) el.textContent = value;
    }

    function setAttr(id, attr, value) {
        var el = document.getElementById(id);
        if (el && value) el.setAttribute(attr, value);
    }

    function show(el) { if (el) el.style.display = ''; }
    function hide(el) { if (el) el.style.display = 'none'; }

    /* ------------------------------------------------------------------ */
    /* Render Projects                                                      */
    /* ------------------------------------------------------------------ */

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderProjects(projects) {
        var grid  = document.getElementById('projects-grid');
        var empty = document.getElementById('projects-empty');
        if (!grid) return;

        var oldCards = grid.querySelectorAll('.project-card');
        for (var i = 0; i < oldCards.length; i++) {
            grid.removeChild(oldCards[i]);
        }

        if (!projects || projects.length === 0) {
            if (empty) empty.style.display = '';
            return;
        }
        if (empty) empty.style.display = 'none';

        projects.forEach(function (proj) {
            var isLarge  = proj.size === 'large';
            var colClass = isLarge ? 'md:col-span-2' : '';
            var tags     = (proj.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
            var tagFirst = tags[0] || '';
            var tagRest  = tags.slice(1);

            var tagsHtml = '';
            if (tagFirst) {
                tagsHtml += '<span class="px-3 py-1 rounded-full bg-primary-500 text-white font-semibold text-xs">' + escHtml(tagFirst) + '</span>';
            }
            tagRest.forEach(function (t) {
                tagsHtml += '<span class="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-xs">' + escHtml(t) + '</span>';
            });

            var linkHtml = '';
            if (proj.link && proj.link.trim()) {
                linkHtml = '<div class="pt-2"><a href="' + escHtml(proj.link) + '" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-primary-400 font-bold text-sm hover:text-primary-300 transition"><span>Lihat Detail Proyek</span><i class="fa-solid fa-arrow-right"></i></a></div>';
            }

            var card = document.createElement('div');
            card.className = 'project-card ' + colClass + ' relative group rounded-3xl overflow-hidden shadow-lg border border-slate-100 bg-slate-900 min-h-[360px] flex flex-col justify-end';
            card.innerHTML =
                '<img src="' + escHtml(proj.image) + '" alt="' + escHtml(proj.name) + '" class="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500">' +
                '<div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>' +
                '<div class="relative p-8 space-y-3 z-10">' +
                    '<div class="flex items-center gap-2 flex-wrap">' + tagsHtml + '</div>' +
                    '<h3 class="' + (isLarge ? 'text-2xl' : 'text-xl') + ' font-bold text-white">' + escHtml(proj.name) + '</h3>' +
                    '<p class="text-slate-300 text-sm font-medium line-clamp-2">' + escHtml(proj.desc) + '</p>' +
                    linkHtml +
                '</div>';
            grid.appendChild(card);
        });
    }

    /* ------------------------------------------------------------------ */
    /* Apply Settings                                                       */
    /* ------------------------------------------------------------------ */

    function applySettings(s) {
        // ── Favicon ──
        var favicon = document.getElementById('favicon-link');
        if (favicon && s.brandLogoUrl) favicon.setAttribute('href', s.brandLogoUrl);

        if (s.pageTitle) document.title = s.pageTitle;

        // ── Navbar Brand (teks / logo) ──
        var brandLogo = document.getElementById('brand-logo');
        var brandName = document.getElementById('brand-name');
        if (s.brandMode === 'logo') {
            if (brandLogo) {
                brandLogo.setAttribute('src', s.brandLogoUrl || 'logo.png');
                brandLogo.style.borderRadius = '50%';
                brandLogo.style.objectFit    = 'cover';
                brandLogo.style.width        = '40px';
                brandLogo.style.height       = '40px';
                show(brandLogo);
            }
            hide(brandName);
        } else {
            hide(brandLogo);
            if (brandName) {
                brandName.textContent = s.brandName || 'RAMXCODE';
                show(brandName);
            }
        }

        // ── Footer Brand ──
        var footerLogo  = document.getElementById('footer-logo');
        var footerBrand = document.getElementById('footer-brand');
        var footerMode  = s.footerMode || 'hidden';

        hide(footerLogo);
        hide(footerBrand);

        if (footerMode === 'logo') {
            if (footerLogo) {
                footerLogo.setAttribute('src', s.footerLogoUrl || 'logo.png');
                show(footerLogo);
            }
        } else if (footerMode === 'text') {
            if (footerBrand) {
                footerBrand.textContent = s.footerBrand || '';
                if (s.footerBrand) show(footerBrand);
            }
        }
        // 'hidden' → both stay hidden (default)

        // Footer copyright
        setText('footer-copyright', s.footerCopyright);

        // ── Hero ──
        setText('hero-role',              s.heroRole);
        setText('hero-heading',           s.heroHeading);
        setText('hero-heading-highlight', s.heroHeadingHighlight);
        setText('hero-name',              s.heroName);
        setText('hero-description',       s.heroDescription);
        setText('hero-availability-text', s.availabilityText);
        setText('hero-availability-sub',  s.availabilitySubtext);
        setAttr('profile-image', 'src',   s.profileImage);

        // ── About ──
        setText('about-description', s.aboutDescription);
        setText('stat-years',        s.statYears);
        setText('stat-projects',     s.statProjects);
        setText('stat-clients',      s.statClients);

        // ── Contact ──
        setText('contact-email',    s.contactEmail);
        setText('contact-phone',    s.contactPhone);
        setText('contact-location', s.contactLocation);

        // ── Social links ──
        setAttr('social-github-1',    'href', s.socialGithub);
        setAttr('social-linkedin-1',  'href', s.socialLinkedin);
        setAttr('social-instagram-1', 'href', s.socialInstagram);
        setAttr('social-twitter-1',   'href', s.socialTwitter);
        setAttr('social-github-2',    'href', s.socialGithub);
        setAttr('social-linkedin-2',  'href', s.socialLinkedin);
        setAttr('social-instagram-2', 'href', s.socialInstagram);
    }

    /* ------------------------------------------------------------------ */
    /* Langkah 1: Terapkan localStorage segera (sinkron)                   */
    /* ------------------------------------------------------------------ */

    function applyLocalNow() {
        applySettings(getLocalSettings());
        renderProjects(getLocalProjects());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyLocalNow);
    } else {
        applyLocalNow();
    }

    /* ------------------------------------------------------------------ */
    /* Langkah 2: Fetch dari API database (async, update di background)    */
    /* ------------------------------------------------------------------ */

    var apiUrl = localStorage.getItem(API_URL_KEY);
    if (apiUrl) {
        fetch(apiUrl, {
            method:  'GET',
            headers: { 'Accept': 'application/json' },
        })
        .then(function (r) {
            return r.ok ? r.json() : Promise.reject('HTTP ' + r.status);
        })
        .then(function (data) {
            if (!data || data.error || Object.keys(data).length === 0) return;

            var projects = data['_projects'];
            delete data['_projects'];
            delete data['_updated_at'];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            if (Array.isArray(projects)) {
                localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
                renderProjects(projects);
            }

            applySettings(getLocalSettings());
        })
        .catch(function () { /* gagal diam-diam */ });
    }

})();
