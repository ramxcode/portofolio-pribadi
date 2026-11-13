<?php
/**
 * config.php — Konfigurasi Database cPanel
 *
 * LANGKAH PENGISIAN:
 * 1. Buka cPanel → MySQL Databases
 * 2. Buat database baru, catat namanya (format: namauser_namadb)
 * 3. Buat user database, catat username & password-nya
 * 4. Assign user ke database (berikan ALL PRIVILEGES)
 * 5. Isi kredensial di bawah, lalu upload semua file ke hosting
 * 6. Buka install.php di browser untuk membuat tabel
 *
 * !! JANGAN pernah share atau commit file ini secara publik !!
 */

// ── Kredensial Database ─────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'ramxcode_porto');
define('DB_USER', 'ramxcode_porto');
define('DB_PASS', 'Ramxcode00#');
define('API_SECRET', 'RamxCode@Porto2026#Secret!');

