/**
 * admin.js — Admin Panel Logic
 * Mengelola autentikasi, load/save pengaturan (localStorage + MySQL API),
 * navigasi tab, ganti password, konfigurasi koneksi database, dan manajemen proyek.
 */
(function () {
    'use strict';

    // ================================================================
    // CONSTANTS
    // ================================================================
    var STORAGE_KEY     = 'ramxcode_portfolio_settings';
    var PROJECTS_KEY    = 'ramxcode_portfolio_projects';
    var AUTH_KEY        = 'ramxcode_admin_session';
    var PASS_KEY        = 'ramxcode_admin_password';
    var API_URL_KEY     = 'ramxcode_api_url';
    var API_SECRET_KEY  = 'ramxcode_api_secret';

    var DEFAULTS = {
        brandName:            'RAMXCODE',
        brandMode:            'text',
        brandLogoUrl:         'logo.png',
        footerBrand:          '',
        footerMode:           'hidden',
        footerLogoUrl:        'logo.png',
        footerCopyright:      '\u00A9 2026 RAMXCODE. All Right Reserved.',
        pageTitle:            'RAMXCODE - Portofolio',
        heroRole:             'Frontend Developer & UI/UX Enthusiast',
        heroHeading:          'Membangun Pengalaman Digital yang ',
        heroHeadingHighlight: 'Interaktif & Modern',
        heroName:             'RAMXCODE',
        heroDescription:      'Saya membantu mengubah ide kreatif menjadi antarmuka web yang bersih, responsif, berkinerja tinggi, dan memukau.',
        profileImage:         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
        availabilityText:     'Tersedia untuk Freelance',
        availabilitySubtext:  'Siap mengerjakan proyek baru',
        aboutDescription:     'Saya adalah seorang Frontend Developer yang berfokus pada pembuatan pengalaman web yang interaktif, cepat, dan ramah pengguna.',
        statYears:            '3+',
        statProjects:         '0',
        statClients:          '100%',
        contactEmail:         'ramzneverrlus@gmail.com',
        contactPhone:         '+6287779401899',
        contactLocation:      'Medan, Indonesia',
        socialGithub:         '#',
        socialLinkedin:       '#',
        socialInstagram:      '#',
        socialTwitter:        '#',
    };

    // ================================================================
    // HELPERS — LOCAL STORAGE
    // ================================================================

    function getDefaultPassword() {
        return localStorage.getItem(PASS_KEY) || 'ramxcode2026';
    }

    function getSavedSettings() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch (e) { return {}; }
    }

    function saveLocalSettings(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getSavedProjects() {
        try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); }
        catch (e) { return []; }
    }

    function saveLocalProjects(projects) {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }

    function getApiUrl()    { return localStorage.getItem(API_URL_KEY)    || ''; }
    function getApiSecret() { return localStorage.getItem(API_SECRET_KEY) || ''; }

    // ================================================================
    // API — DATABASE FUNCTIONS
    // ================================================================

    function fetchFromApi() {
        var url = getApiUrl();
        if (!url) return Promise.resolve(null);
        return fetch(url, {
            method:  'GET',
            headers: { 'Accept': 'application/json' },
        })
        .then(function (r) {
            return r.ok ? r.json() : Promise.reject('HTTP ' + r.status);
        })
        .catch(function (e) {
            console.warn('[RAMXCODE API] Fetch gagal:', e);
            return null;
        });
    }

    function saveToApi(settings, projects) {
        var url    = getApiUrl();
        var secret = getApiSecret();
        if (!url || !secret) return Promise.resolve({ skipped: true });

        var payload = Object.assign({}, settings, {
            _projects: projects || [],
            _secret:   secret,
        });

        return fetch(url, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': 'Bearer ' + secret,
                'X-Api-Key':     secret,
            },
            body: JSON.stringify(payload),
        })
        .then(function (r) { return r.json(); })
        .catch(function (e) { return { error: e.message || 'Network error' }; });
    }

    // ================================================================
    // DB STATUS INDICATOR
    // ================================================================

    function setDbStatus(status) {
        var dot  = document.getElementById('db-status-dot');
        var text = document.getElementById('db-status-text');
        if (!dot || !text) return;

        var configs = {
            none:      { cls: 'bg-slate-400',                      label: 'Tanpa Database' },
            checking:  { cls: 'bg-yellow-400 animate-pulse',       label: 'Memeriksa...'  },
            connected: { cls: 'bg-green-400',                      label: 'DB Terhubung'  },
            error:     { cls: 'bg-red-400',                        label: 'DB Error'      },
        };
        var c = configs[status] || configs.none;
        dot.className  = 'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + c.cls;
        text.textContent = c.label;
    }

    // ================================================================
    // TOAST NOTIFICATION
    // ================================================================

    function showToast(message, type) {
        var toast  = document.getElementById('toast');
        if (!toast) return;
        var colors = {
            success: '#22c55e',
            error:   '#ef4444',
            info:    '#0ea5e9',
            warn:    '#f59e0b',
        };
        toast.textContent      = message;
        toast.style.background = colors[type] || colors.info;
        toast.classList.remove('toast-hidden');
        toast.classList.add('toast-visible');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            toast.classList.remove('toast-visible');
            toast.classList.add('toast-hidden');
        }, 4500);
    }

    // ================================================================
    // AUTHENTICATION
    // ================================================================

    var loginScreen  = document.getElementById('login-screen');
    var adminPanel   = document.getElementById('admin-panel');
    var loginForm    = document.getElementById('login-form');
    var loginError   = document.getElementById('login-error');

    // Flag untuk memastikan panel hanya diinisialisasi sekali
    var panelInitialized = false;

    // Auto-login jika sesi masih aktif di tab ini
    if (sessionStorage.getItem(AUTH_KEY) === '1') {
        showPanel();
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var pwd = document.getElementById('admin-password').value;
        if (pwd === getDefaultPassword()) {
            sessionStorage.setItem(AUTH_KEY, '1');
            loginError.classList.add('hidden');
            showPanel();
        } else {
            loginError.classList.remove('hidden');
            document.getElementById('admin-password').value = '';
            document.getElementById('admin-password').focus();
        }
    });

    document.getElementById('logout-btn').addEventListener('click', function () {
        sessionStorage.removeItem(AUTH_KEY);
        adminPanel.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        document.getElementById('admin-password').value = '';
    });

    function showPanel() {
        loginScreen.classList.add('hidden');
        adminPanel.classList.remove('hidden');

        // Inisialisasi panel hanya sekali
        if (!panelInitialized) {
            panelInitialized = true;
            initPanel();
        }

        // Isi field konfigurasi API
        var apiUrlEl    = document.getElementById('api-url-input');
        var apiSecretEl = document.getElementById('api-secret-input');
        if (apiUrlEl)    apiUrlEl.value    = getApiUrl();
        if (apiSecretEl) apiSecretEl.value = getApiSecret();

        // Muat pengaturan: coba dari database dulu, fallback ke localStorage
        if (getApiUrl()) {
            setDbStatus('checking');
            fetchFromApi().then(function (apiData) {
                if (apiData && !apiData.error) {
                    var clean    = Object.assign({}, apiData);
                    var projects = clean['_projects'];
                    delete clean['_projects'];
                    delete clean['_updated_at'];
                    saveLocalSettings(clean);

                    if (Array.isArray(projects)) {
                        saveLocalProjects(projects);
                    }
                    setDbStatus('connected');
                } else {
                    setDbStatus('error');
                }
                loadSettingsIntoForm();
                renderAdminProjects();
            });
        } else {
            setDbStatus('none');
            loadSettingsIntoForm();
            renderAdminProjects();
        }
    }

    // ================================================================
    // INIT PANEL — semua event listener diinisialisasi di sini
    // agar dipastikan elemen DOM sudah ada di halaman
    // ================================================================

    function initPanel() {

        // ============================================================
        // SETTINGS FORM — LOAD & SAVE
        // ============================================================

        loadSettingsIntoForm();

        // Brand Mode radio toggle
        document.querySelectorAll('input[name="brandMode"]').forEach(function (radio) {
            radio.addEventListener('change', function () { updateBrandModeUI(this.value); });
        });

        // Footer Mode radio toggle
        document.querySelectorAll('input[name="footerMode"]').forEach(function (radio) {
            radio.addEventListener('change', function () { updateFooterModeUI(this.value); });
        });

        // Logo URL live preview
        var logoUrlField = document.getElementById('field-brandLogoUrl');
        if (logoUrlField) {
            logoUrlField.addEventListener('input', function () { updateLogoPreview(this.value); });
        }

        // Settings Form submit
        var settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var newData = {};

                // Kumpulkan semua named input/textarea/select dalam form
                var elements = this.elements;
                for (var i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    if (!el.name || el.name === '') continue;
                    if (el.type === 'radio') continue; // radio ditangani terpisah
                    if (el.type === 'submit' || el.type === 'button' || el.type === 'reset') continue;
                    newData[el.name] = el.value ? el.value.trim() : '';
                }

                // Radio: brandMode
                var brandModeRadio = document.querySelector('input[name="brandMode"]:checked');
                if (brandModeRadio) newData['brandMode'] = brandModeRadio.value;

                // Radio: footerMode
                var footerModeRadio = document.querySelector('input[name="footerMode"]:checked');
                if (footerModeRadio) newData['footerMode'] = footerModeRadio.value;

                // Favicon URL = brandLogoUrl jika diisi
                var faviconField = document.getElementById('field-faviconUrl');
                if (faviconField && faviconField.value && faviconField.value.trim() !== '') {
                    newData['brandLogoUrl'] = faviconField.value.trim();
                }

                // Gabungkan dengan data yang sudah ada
                var existing = getSavedSettings();
                var final    = Object.assign({}, existing, newData);

                // 1. Simpan ke localStorage segera
                saveLocalSettings(final);

                // 2. Coba simpan ke database MySQL
                saveToApi(final, getSavedProjects()).then(function (result) {
                    if (result && result.skipped) {
                        showToast('\u2713 Tersimpan di browser! (Database belum dikonfigurasi)', 'success');
                    } else if (result && result.success) {
                        showToast('\u2713 Tersimpan ke database MySQL!', 'success');
                        setDbStatus('connected');
                    } else {
                        var msg = (result && result.error) ? result.error : 'Periksa konfigurasi API.';
                        showToast('\u26A0\uFE0F Browser OK \u00B7 Database: ' + msg, 'warn');
                        setDbStatus('error');
                    }
                });

                return false;
            });
        }

        // Reset buttons
        document.querySelectorAll('.reset-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!confirm('Reset SEMUA pengaturan ke nilai default?\nPerubahan yang belum disimpan akan hilang.')) return;
                localStorage.removeItem(STORAGE_KEY);
                loadSettingsIntoForm();
                showToast('\u21BA Pengaturan direset ke default!', 'info');
            });
        });

        // ============================================================
        // TAB NAVIGATION
        // ============================================================

        var tabBtns         = document.querySelectorAll('.tab-btn');
        var settingsWrapper = document.getElementById('settings-wrapper');
        var tabSecurity     = document.getElementById('tab-security');
        var tabProjects     = document.getElementById('tab-projects');
        var tabContents     = document.querySelectorAll('.tab-content');

        tabBtns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var target = this.getAttribute('data-tab');

                // Update active state
                tabBtns.forEach(function (b) {
                    b.classList.remove('active-tab');
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = '';
                });
                this.classList.add('active-tab');

                // Sembunyikan semua panel
                if (settingsWrapper) settingsWrapper.classList.add('hidden');
                if (tabSecurity)     tabSecurity.classList.add('hidden');
                if (tabProjects)     tabProjects.classList.add('hidden');
                tabContents.forEach(function (el) { el.classList.add('hidden'); });

                // Tampilkan panel yang dipilih
                if (target === 'security') {
                    if (tabSecurity) tabSecurity.classList.remove('hidden');
                } else if (target === 'projects') {
                    if (tabProjects) tabProjects.classList.remove('hidden');
                    renderAdminProjects();
                } else {
                    if (settingsWrapper) settingsWrapper.classList.remove('hidden');
                    var activeEl = document.getElementById('tab-' + target);
                    if (activeEl) activeEl.classList.remove('hidden');
                }
            });
        });

        // ============================================================
        // CHANGE PASSWORD
        // ============================================================

        var changePassForm = document.getElementById('change-password-form');
        if (changePassForm) {
            changePassForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var current  = document.getElementById('current-password').value;
                var newPwd   = document.getElementById('new-password').value;
                var confirmP = document.getElementById('confirm-password').value;
                var errorEl  = document.getElementById('password-error');

                errorEl.classList.add('hidden');

                if (current !== getDefaultPassword()) {
                    errorEl.textContent = '\u2715 Password saat ini salah!';
                    errorEl.classList.remove('hidden');
                    return;
                }
                if (newPwd.length < 6) {
                    errorEl.textContent = '\u2715 Password baru minimal 6 karakter!';
                    errorEl.classList.remove('hidden');
                    return;
                }
                if (newPwd !== confirmP) {
                    errorEl.textContent = '\u2715 Konfirmasi password tidak cocok!';
                    errorEl.classList.remove('hidden');
                    return;
                }

                localStorage.setItem(PASS_KEY, newPwd);
                changePassForm.reset();
                showToast('\u2713 Password berhasil diubah!', 'success');
            });
        }

        // ============================================================
        // API CONFIGURATION
        // ============================================================

        var apiConfigForm = document.getElementById('api-config-form');
        if (apiConfigForm) {
            apiConfigForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var url    = document.getElementById('api-url-input').value.trim();
                var secret = document.getElementById('api-secret-input').value.trim();

                localStorage.setItem(API_URL_KEY,    url);
                localStorage.setItem(API_SECRET_KEY, secret);
                showToast('\u2713 Konfigurasi API disimpan!', 'success');

                if (url) {
                    setDbStatus('checking');
                    fetchFromApi().then(function (data) {
                        setDbStatus(data && !data.error ? 'connected' : 'error');
                    });
                } else {
                    setDbStatus('none');
                }
            });
        }

        // Test Connection button
        var testBtn = document.getElementById('test-api-btn');
        if (testBtn) {
            testBtn.addEventListener('click', function () {
                var url      = document.getElementById('api-url-input').value.trim();
                var secret   = document.getElementById('api-secret-input').value.trim();
                var resultEl = document.getElementById('api-test-result');

                if (!url) {
                    showToast('\u2715 Masukkan URL API terlebih dahulu!', 'error');
                    return;
                }

                testBtn.disabled    = true;
                testBtn.textContent = 'Memeriksa...';
                setDbStatus('checking');
                if (resultEl) resultEl.classList.add('hidden');

                fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
                .then(function (r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
                .then(function (data) {
                    var payload = Object.assign({}, data || {}, { _secret: secret });
                    return fetch(url, {
                        method:  'POST',
                        headers: {
                            'Content-Type':  'application/json',
                            'Authorization': 'Bearer ' + secret,
                            'X-Api-Key':     secret,
                        },
                        body: JSON.stringify(payload),
                    });
                })
                .then(function (r) { return r.json(); })
                .then(function (result) {
                    testBtn.disabled  = false;
                    testBtn.innerHTML = '<i class="fa-solid fa-plug mr-1"></i> Test Koneksi';

                    if (result && result.success) {
                        setDbStatus('connected');
                        showToast('\u2713 Koneksi berhasil! Database siap digunakan.', 'success');
                        if (resultEl) {
                            resultEl.className   = 'mt-3 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold';
                            resultEl.textContent = '\u2713 API terhubung & autentikasi berhasil. Database MySQL siap!';
                            resultEl.classList.remove('hidden');
                        }
                    } else {
                        setDbStatus('error');
                        var errMsg = (result && result.error) ? result.error : 'Unknown';
                        showToast('\u2715 Autentikasi gagal: ' + errMsg, 'error');
                        if (resultEl) {
                            resultEl.className   = 'mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold';
                            resultEl.textContent = '\u2715 ' + errMsg + '. Periksa API_SECRET di config.php.';
                            resultEl.classList.remove('hidden');
                        }
                    }
                })
                .catch(function (err) {
                    testBtn.disabled  = false;
                    testBtn.innerHTML = '<i class="fa-solid fa-plug mr-1"></i> Test Koneksi';
                    setDbStatus('error');
                    showToast('\u2715 Koneksi gagal. Periksa URL dan pastikan api.php sudah diunggah.', 'error');
                    if (resultEl) {
                        resultEl.className   = 'mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold';
                        resultEl.textContent = '\u2715 Tidak dapat terhubung ke ' + url + '. Pastikan file api.php & config.php sudah benar di server.';
                        resultEl.classList.remove('hidden');
                    }
                });
            });
        }

        // ============================================================
        // PROJECT MANAGEMENT
        // ============================================================

        initProjectManagement();

        // ============================================================
        // LOGO FILE UPLOAD
        // ============================================================

        initLogoUpload();

        // ============================================================
        // PROFILE PHOTO UPLOAD
        // ============================================================

        initProfileUpload();
    }

    // ================================================================
    // SETTINGS FORM — LOAD INTO FORM
    // ================================================================

    function loadSettingsIntoForm() {
        var saved  = getSavedSettings();
        var noFallback = ['footerBrand'];
        var merged = {};
        for (var key in DEFAULTS) {
            if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
                if (noFallback.indexOf(key) >= 0) {
                    merged[key] = (saved[key] !== undefined && saved[key] !== null) ? saved[key] : DEFAULTS[key];
                } else {
                    merged[key] = (saved[key] && String(saved[key]).trim() !== '')
                        ? saved[key]
                        : DEFAULTS[key];
                }
            }
        }

        for (var fieldKey in merged) {
            var el = document.getElementById('field-' + fieldKey);
            if (el) el.value = merged[fieldKey];
        }

        // Radio: brandMode
        var brandModeVal = merged['brandMode'] || 'text';
        var radioText = document.getElementById('field-brandMode-text');
        var radioLogo = document.getElementById('field-brandMode-logo');
        if (radioText) radioText.checked = (brandModeVal === 'text');
        if (radioLogo) radioLogo.checked = (brandModeVal === 'logo');
        updateBrandModeUI(brandModeVal);

        // Radio: footerMode
        var footerModeVal = merged['footerMode'] || 'hidden';
        var fHidden = document.getElementById('field-footerMode-hidden');
        var fText   = document.getElementById('field-footerMode-text');
        var fLogo   = document.getElementById('field-footerMode-logo');
        if (fHidden) fHidden.checked = (footerModeVal === 'hidden');
        if (fText)   fText.checked   = (footerModeVal === 'text');
        if (fLogo)   fLogo.checked   = (footerModeVal === 'logo');
        updateFooterModeUI(footerModeVal);

        // Logo preview
        updateLogoPreview(merged['brandLogoUrl'] || 'logo.png');

        // Sync favicon field
        var faviconField = document.getElementById('field-faviconUrl');
        if (faviconField) faviconField.value = merged['brandLogoUrl'] || 'logo.png';
    }

    function updateBrandModeUI(mode) {
        var nameGroup = document.getElementById('brand-name-group');
        var logoGroup = document.getElementById('brand-logo-group');
        if (nameGroup) nameGroup.style.display = (mode === 'logo') ? 'none' : '';
        if (logoGroup) logoGroup.style.display = (mode === 'text') ? 'none' : '';
    }

    function updateFooterModeUI(mode) {
        var textGroup = document.getElementById('footer-brand-text-group');
        var logoGroup = document.getElementById('footer-logo-group');
        if (textGroup) textGroup.style.display = (mode === 'text') ? '' : 'none';
        if (logoGroup) logoGroup.style.display = (mode === 'logo') ? '' : 'none';
    }

    function updateLogoPreview(url) {
        var prev = document.getElementById('brand-logo-preview-img');
        if (prev && url) prev.src = url;
    }

    // ================================================================
    // PROJECT MANAGEMENT
    // ================================================================

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderAdminProjects() {
        var projectsList      = document.getElementById('projects-list');
        var projectsListEmpty = document.getElementById('projects-list-empty');
        if (!projectsList) return;

        var projects = getSavedProjects();

        // Hapus semua item kecuali elemen "empty" placeholder
        while (projectsList.children.length > 1) {
            projectsList.removeChild(projectsList.lastChild);
        }

        if (!projects || projects.length === 0) {
            if (projectsListEmpty) projectsListEmpty.style.display = '';
            return;
        }
        if (projectsListEmpty) projectsListEmpty.style.display = 'none';

        projects.forEach(function (proj, idx) {
            var item = document.createElement('div');
            item.className = 'flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition';
            item.innerHTML =
                '<div class="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">' +
                    (proj.image ? '<img src="' + escHtml(proj.image) + '" class="w-full h-full object-cover" onerror="this.style.display=\'none\'">' : '') +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                    '<p class="font-bold text-slate-900 text-sm truncate">' + escHtml(proj.name) + '</p>' +
                    '<p class="text-xs text-primary-600 font-semibold mt-0.5 truncate">' + escHtml(proj.tags || '') + '</p>' +
                    '<p class="text-xs text-slate-500 mt-1 line-clamp-2">' + escHtml(proj.desc || '') + '</p>' +
                    '<span class="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ' +
                        (proj.size === 'large' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600') + '">' +
                        (proj.size === 'large' ? 'Lebar (featured)' : 'Normal') +
                    '</span>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-shrink-0">' +
                    '<button type="button" data-action="edit" data-idx="' + idx + '" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"><i class="fa-solid fa-pen mr-1"></i>Edit</button>' +
                    '<button type="button" data-action="delete" data-idx="' + idx + '" class="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 font-semibold text-xs hover:bg-red-100 transition"><i class="fa-solid fa-trash mr-1"></i>Hapus</button>' +
                    (idx > 0 ? '<button type="button" data-action="up" data-idx="' + idx + '" class="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition text-xs"><i class="fa-solid fa-arrow-up"></i></button>' : '') +
                    (idx < projects.length - 1 ? '<button type="button" data-action="down" data-idx="' + idx + '" class="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition text-xs"><i class="fa-solid fa-arrow-down"></i></button>' : '') +
                '</div>';
            projectsList.appendChild(item);
        });
    }

    function initProjectManagement() {
        var projectForm       = document.getElementById('project-form');
        var projectsList      = document.getElementById('projects-list');
        var projectCancelBtn  = document.getElementById('project-cancel-edit');
        var projectSaveLabel  = document.getElementById('project-save-label');
        var projectEditIndex  = document.getElementById('project-edit-index');

        if (!projectsList) return;

        // Handle action buttons in project list (event delegation)
        projectsList.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action   = btn.getAttribute('data-action');
            var idx      = parseInt(btn.getAttribute('data-idx'), 10);
            var projects = getSavedProjects();

            if (action === 'delete') {
                if (!confirm('Hapus proyek "' + projects[idx].name + '"?')) return;
                projects.splice(idx, 1);
                saveLocalProjects(projects);
                renderAdminProjects();
                syncProjects(projects);
                showToast('\u2713 Proyek dihapus!', 'success');
            }

            if (action === 'edit') {
                var proj = projects[idx];
                var nameEl  = document.getElementById('proj-name');
                var tagsEl  = document.getElementById('proj-tags');
                var descEl  = document.getElementById('proj-desc');
                var imageEl = document.getElementById('proj-image');
                var linkEl  = document.getElementById('proj-link');
                var sizeEl  = document.getElementById('proj-size');
                if (nameEl)  nameEl.value  = proj.name  || '';
                if (tagsEl)  tagsEl.value  = proj.tags  || '';
                if (descEl)  descEl.value  = proj.desc  || '';
                if (imageEl) imageEl.value = proj.image || '';
                if (linkEl)  linkEl.value  = proj.link  || '';
                if (sizeEl)  sizeEl.value  = proj.size  || 'normal';
                if (projectEditIndex)  projectEditIndex.value = idx;
                if (projectSaveLabel)  projectSaveLabel.textContent = 'Perbarui Proyek';
                if (projectCancelBtn)  projectCancelBtn.classList.remove('hidden');
                if (projectForm) projectForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            if (action === 'up' && idx > 0) {
                var tmp = projects[idx - 1];
                projects[idx - 1] = projects[idx];
                projects[idx] = tmp;
                saveLocalProjects(projects);
                renderAdminProjects();
                syncProjects(projects);
            }

            if (action === 'down' && idx < projects.length - 1) {
                var tmp2 = projects[idx + 1];
                projects[idx + 1] = projects[idx];
                projects[idx] = tmp2;
                saveLocalProjects(projects);
                renderAdminProjects();
                syncProjects(projects);
            }
        });

        // Cancel edit
        if (projectCancelBtn) {
            projectCancelBtn.addEventListener('click', function () {
                if (projectForm) projectForm.reset();
                if (projectEditIndex)  projectEditIndex.value = -1;
                if (projectSaveLabel)  projectSaveLabel.textContent = 'Simpan Proyek';
                projectCancelBtn.classList.add('hidden');
            });
        }

        // Add / Update project
        if (projectForm) {
            projectForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var projects = getSavedProjects();
                var editIdx  = parseInt(projectEditIndex ? projectEditIndex.value : '-1', 10);

                var nameEl  = document.getElementById('proj-name');
                var tagsEl  = document.getElementById('proj-tags');
                var descEl  = document.getElementById('proj-desc');
                var imageEl = document.getElementById('proj-image');
                var linkEl  = document.getElementById('proj-link');
                var sizeEl  = document.getElementById('proj-size');

                var proj = {
                    name:  nameEl  ? nameEl.value.trim()  : '',
                    tags:  tagsEl  ? tagsEl.value.trim()  : '',
                    desc:  descEl  ? descEl.value.trim()  : '',
                    image: imageEl ? imageEl.value.trim() : '',
                    link:  linkEl  ? linkEl.value.trim()  : '',
                    size:  sizeEl  ? sizeEl.value         : 'normal',
                };

                if (!proj.name) {
                    showToast('\u2715 Nama proyek wajib diisi!', 'error');
                    return;
                }

                if (editIdx >= 0 && editIdx < projects.length) {
                    projects[editIdx] = proj;
                    showToast('\u2713 Proyek diperbarui!', 'success');
                } else {
                    projects.push(proj);
                    showToast('\u2713 Proyek ditambahkan!', 'success');
                }

                saveLocalProjects(projects);
                renderAdminProjects();
                syncProjects(projects);

                // Reset form
                projectForm.reset();
                if (projectEditIndex)  projectEditIndex.value = -1;
                if (projectSaveLabel)  projectSaveLabel.textContent = 'Simpan Proyek';
                if (projectCancelBtn)  projectCancelBtn.classList.add('hidden');
            });
        }
    }

    function syncProjects(projects) {
        var url    = getApiUrl();
        var secret = getApiSecret();
        if (!url || !secret) return;

        var settings = getSavedSettings();
        saveToApi(settings, projects).then(function (result) {
            if (result && result.success) {
                setDbStatus('connected');
            } else if (result && !result.skipped) {
                setDbStatus('error');
            }
        });
    }

    // ================================================================
    // LOGO FILE UPLOAD
    // ================================================================

    function initLogoUpload() {
        var logoFileInput  = document.getElementById('logo-file-input');
        var logoFileName   = document.getElementById('logo-file-name');
        var logoUploadPrev = document.getElementById('logo-upload-preview');
        var logoPreviewImg = document.getElementById('logo-upload-preview-img');
        var logoPreviewDrk = document.getElementById('logo-upload-preview-dark');
        var logoSaveBtn    = document.getElementById('logo-upload-save-btn');
        var logoUploadStat = document.getElementById('logo-upload-status');

        var _uploadedLogoDataUrl = null;

        if (logoFileInput) {
            logoFileInput.addEventListener('change', function () {
                var f = this.files[0];
                if (!f) return;
                if (logoFileName) logoFileName.textContent = f.name;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    _uploadedLogoDataUrl = ev.target.result;
                    if (logoPreviewImg) logoPreviewImg.src = _uploadedLogoDataUrl;
                    if (logoPreviewDrk) logoPreviewDrk.src = _uploadedLogoDataUrl;
                    if (logoUploadPrev) logoUploadPrev.classList.remove('hidden');
                    var faviconField = document.getElementById('field-faviconUrl');
                    if (faviconField) faviconField.value = 'logo.png';
                    if (logoUploadStat) logoUploadStat.textContent = '';
                };
                reader.readAsDataURL(f);
            });
        }

        if (logoSaveBtn) {
            logoSaveBtn.addEventListener('click', function () {
                if (!_uploadedLogoDataUrl) {
                    showToast('\u2715 Pilih file gambar terlebih dahulu!', 'error');
                    return;
                }
                var url    = getApiUrl();
                var secret = getApiSecret();

                var settings = getSavedSettings();
                settings['brandLogoUrl']  = _uploadedLogoDataUrl;
                settings['footerLogoUrl'] = _uploadedLogoDataUrl;
                saveLocalSettings(settings);

                var faviconField = document.getElementById('field-faviconUrl');
                if (faviconField) faviconField.value = _uploadedLogoDataUrl;
                var logoUrlField = document.getElementById('field-brandLogoUrl');
                if (logoUrlField) { logoUrlField.value = _uploadedLogoDataUrl; updateLogoPreview(_uploadedLogoDataUrl); }

                if (logoUploadStat) {
                    logoUploadStat.textContent = '\u2713 Logo disimpan di browser!';
                    logoUploadStat.style.color = '#22c55e';
                }
                showToast('\u2713 Logo berhasil diperbarui!', 'success');

                if (url && secret) {
                    saveToApi(settings, getSavedProjects()).then(function (r) {
                        if (r && r.success) {
                            if (logoUploadStat) logoUploadStat.textContent = '\u2713 Logo disimpan ke database!';
                            setDbStatus('connected');
                        }
                    });
                }
            });
        }
    }

    // ================================================================
    // PROFILE PHOTO UPLOAD
    // ================================================================

    function initProfileUpload() {
        var profileFileInput  = document.getElementById('profile-file-input');
        var profileFileName   = document.getElementById('profile-file-name');
        var profileUploadPrev = document.getElementById('profile-upload-preview');
        var profilePreviewImg = document.getElementById('profile-upload-preview-img');
        var profileSaveBtn    = document.getElementById('profile-upload-save-btn');
        var profileUploadStat = document.getElementById('profile-upload-status');
        var profileUrlField   = document.getElementById('field-profileImage');

        var _uploadedProfileDataUrl = null;

        if (profileFileInput) {
            profileFileInput.addEventListener('change', function () {
                var f = this.files[0];
                if (!f) return;
                if (profileFileName) profileFileName.textContent = f.name;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    _uploadedProfileDataUrl = ev.target.result;
                    if (profilePreviewImg) profilePreviewImg.src = _uploadedProfileDataUrl;
                    if (profileUploadPrev) profileUploadPrev.classList.remove('hidden');
                    if (profileUploadStat) profileUploadStat.textContent = '';
                };
                reader.readAsDataURL(f);
            });
        }

        if (profileSaveBtn) {
            profileSaveBtn.addEventListener('click', function () {
                if (!_uploadedProfileDataUrl) {
                    showToast('\u2715 Pilih file foto terlebih dahulu!', 'error');
                    return;
                }

                // Simpan ke localStorage
                var settings = getSavedSettings();
                settings['profileImage'] = _uploadedProfileDataUrl;
                saveLocalSettings(settings);

                // Update field URL juga
                if (profileUrlField) profileUrlField.value = _uploadedProfileDataUrl;

                // Update live di halaman (jika settings.js sudah load)
                var profileImgEl = null;
                try {
                    // Coba update preview di halaman utama jika iframe atau window tersedia
                } catch(e) {}

                if (profileUploadStat) {
                    profileUploadStat.textContent = '\u2713 Foto profil disimpan di browser!';
                    profileUploadStat.style.color = '#22c55e';
                }
                showToast('\u2713 Foto profil berhasil diperbarui!', 'success');

                // Simpan ke API jika dikonfigurasi
                var url    = getApiUrl();
                var secret = getApiSecret();
                if (url && secret) {
                    saveToApi(settings, getSavedProjects()).then(function (r) {
                        if (r && r.success) {
                            if (profileUploadStat) profileUploadStat.textContent = '\u2713 Foto profil disimpan ke database!';
                            setDbStatus('connected');
                        }
                    });
                }
            });
        }
    }

})();
