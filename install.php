<?php
/**
 * install.php — Installer Database Portfolio RAMXCODE
 *
 * Buka file ini SEKALI di browser setelah mengisi config.php.
 * Setelah instalasi berhasil, HAPUS file ini dari server!
 */

$status  = 'idle';
$message = '';
$details = [];

if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        $status  = 'error';
        $message = 'Koneksi database gagal: ' . htmlspecialchars($conn->connect_error);
        $details = [
            'Pastikan kredensial di <code>config.php</code> sudah benar.',
            'Format username cPanel: <code>namauser_namadb</code>',
            'Format DB Name cPanel: <code>namauser_namadb</code>',
            'Hostname biasanya <code>localhost</code> di cPanel.',
        ];
    } else {
        $conn->set_charset('utf8mb4');

        $sql = "
            CREATE TABLE IF NOT EXISTS `portfolio_settings` (
                `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
                `settings_json` LONGTEXT
                                CHARACTER SET    utf8mb4
                                COLLATE          utf8mb4_unicode_ci,
                `updated_at`    TIMESTAMP        NOT NULL
                                DEFAULT          CURRENT_TIMESTAMP
                                ON UPDATE        CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB
              DEFAULT CHARSET=utf8mb4
              COLLATE=utf8mb4_unicode_ci;
        ";

        if ($conn->multi_query($sql)) {
            $status  = 'success';
            $message = 'Tabel <code>portfolio_settings</code> berhasil dibuat!';
            $details = [
                'Buka <code>admin.html</code> dan login ke Admin Panel.',
                'Pergi ke tab <strong>Keamanan</strong> → bagian <strong>Koneksi Database</strong>.',
                'Isi <strong>URL API</strong> dengan: <code>https://domainanda.com/api.php</code>',
                'Isi <strong>API Secret Key</strong> dengan nilai <code>API_SECRET</code> di <code>config.php</code>.',
                'Klik <strong>Test Koneksi</strong>, lalu <strong>Simpan Konfigurasi</strong>.',
                '<strong style="color:#dc2626">⚠️ Hapus file <code>install.php</code> ini dari server setelah selesai!</strong>',
            ];
        } else {
            $status  = 'error';
            $message = 'Gagal membuat tabel: ' . htmlspecialchars($conn->error);
        }
        $conn->close();
    }
} else {
    $status  = 'error';
    $message = 'File <code>config.php</code> tidak ditemukan!';
    $details = [
        'Pastikan <code>config.php</code> sudah diunggah ke folder yang sama dengan <code>install.php</code>.',
        'Edit <code>config.php</code> terlebih dahulu dengan kredensial database cPanel Anda.',
    ];
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Installer Database — RAMXCODE Portfolio</title>
<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #f0f9ff 0%, #e2e8f0 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        color: #1e293b;
    }
    .card {
        background: #fff;
        border-radius: 1.5rem;
        padding: 2.5rem;
        max-width: 560px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
    }
    .logo {
        width: 3.5rem; height: 3.5rem;
        background: #0ea5e9;
        border-radius: 1rem;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 1.25rem;
        box-shadow: 0 8px 20px rgba(14,165,233,0.3);
    }
    .logo svg { width: 1.5rem; height: 1.5rem; stroke: white; fill: none; stroke-width: 2; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; margin-bottom: 1.75rem; }
    .alert {
        padding: 1rem 1.25rem;
        border-radius: 0.875rem;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }
    .alert-success { background: #f0fdf4; border: 1.5px solid #86efac; color: #15803d; }
    .alert-error   { background: #fef2f2; border: 1.5px solid #fca5a5; color: #b91c1c; }
    .steps {
        list-style: none;
        counter-reset: step;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .steps li {
        counter-increment: step;
        display: flex;
        gap: 0.875rem;
        font-size: 0.875rem;
        color: #475569;
        align-items: flex-start;
        line-height: 1.6;
    }
    .steps li::before {
        content: counter(step);
        min-width: 1.75rem; height: 1.75rem;
        background: #e0f2fe;
        color: #0284c7;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 700;
        flex-shrink: 0;
    }
    code {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        padding: 0.1rem 0.4rem;
        border-radius: 0.3rem;
        font-family: 'Courier New', Consolas, monospace;
        font-size: 0.8125rem;
        color: #0f172a;
    }
    .info-box {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #fffbeb;
        border: 1.5px solid #fcd34d;
        border-radius: 0.75rem;
        font-size: 0.8125rem;
        color: #92400e;
        font-weight: 600;
        line-height: 1.6;
    }
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding: 0.75rem 1.5rem;
        background: #0ea5e9;
        color: #fff;
        border-radius: 0.75rem;
        font-weight: 700;
        font-size: 0.875rem;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(14,165,233,0.3);
        transition: background 0.15s;
    }
    .btn:hover { background: #0284c7; }
    .divider { height: 1px; background: #f1f5f9; margin: 1.5rem 0; }
    .db-info {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 1rem;
        font-size: 0.8125rem;
        color: #475569;
    }
    .db-info strong { color: #0f172a; display: block; margin-bottom: 0.5rem; }
    .db-info div { display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #f1f5f9; }
    .db-info div:last-child { border-bottom: none; }
    .db-info .label { color: #64748b; }
    .db-info .value { font-weight: 600; color: #0f172a; }
</style>
</head>
<body>
<div class="card">
    <div class="logo">
        <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    </div>
    <h1>Installer Database Portfolio</h1>
    <p class="subtitle">Setup MySQL untuk RAMXCODE Portfolio — cPanel Hosting</p>

    <?php if ($status === 'success'): ?>
        <div class="alert alert-success">
            ✅ <?= $message ?>
        </div>

        <div class="db-info">
            <strong>Informasi Database Terhubung:</strong>
            <div><span class="label">Host</span><span class="value"><?= htmlspecialchars(DB_HOST) ?></span></div>
            <div><span class="label">Database</span><span class="value"><?= htmlspecialchars(DB_NAME) ?></span></div>
            <div><span class="label">User</span><span class="value"><?= htmlspecialchars(DB_USER) ?></span></div>
            <div><span class="label">Tabel</span><span class="value">portfolio_settings ✓</span></div>
        </div>

        <div class="divider"></div>
        <p style="font-size:0.875rem;font-weight:700;color:#0f172a;margin-bottom:0.75rem;">Langkah Selanjutnya:</p>
        <ol class="steps">
            <?php foreach ($details as $d): ?>
                <li><?= $d ?></li>
            <?php endforeach; ?>
        </ol>

        <div class="info-box">
            ⚠️ <strong>WAJIB:</strong> Hapus file <code>install.php</code> dari server setelah selesai setup untuk mencegah akses tidak sah!
        </div>

        <a href="admin.html" class="btn">→ Buka Admin Panel</a>

    <?php elseif ($status === 'error'): ?>
        <div class="alert alert-error">
            ❌ <?= $message ?>
        </div>
        <?php if (!empty($details)): ?>
            <p style="font-size:0.875rem;font-weight:700;color:#0f172a;margin-bottom:0.75rem;">Cara Mengatasi:</p>
            <ol class="steps">
                <?php foreach ($details as $d): ?>
                    <li><?= $d ?></li>
                <?php endforeach; ?>
            </ol>
        <?php endif; ?>
        <div class="info-box">
            💡 Setelah memperbaiki <code>config.php</code>, refresh halaman ini untuk mencoba lagi.
        </div>

    <?php else: ?>
        <div class="alert" style="background:#f0f9ff;border:1.5px solid #bae6fd;color:#0369a1;">
            ℹ️ Siap untuk instalasi. Pastikan <code>config.php</code> sudah diisi dengan benar.
        </div>
    <?php endif; ?>
</div>
</body>
</html>

