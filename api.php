<?php
/**
 * api.php — REST API Portfolio Settings
 *
 * GET  /api.php        → Ambil semua pengaturan (publik)
 * POST /api.php        → Simpan pengaturan (butuh Authorization header)
 */

// ── Security Headers ──────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Load Config ───────────────────────────────────────────────────────────
if (!file_exists(__DIR__ . '/config.php')) {
    http_response_code(503);
    echo json_encode([
        'error' => 'config.php tidak ditemukan. Jalankan install.php untuk setup awal.'
    ]);
    exit;
}
require_once __DIR__ . '/config.php';

// ── Database Connection ───────────────────────────────────────────────────
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Koneksi database gagal.',
        'details' => $conn->connect_error
    ]);
    exit;
}
$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

// ════════════════════════════════════════════════════════════════
// GET — Ambil pengaturan (publik)
// ════════════════════════════════════════════════════════════════
if ($method === 'GET') {
    $result = $conn->query(
        "SELECT settings_json, updated_at FROM portfolio_settings WHERE id = 1 LIMIT 1"
    );

    if ($result && $row = $result->fetch_assoc()) {
        $data = json_decode($row['settings_json'], true) ?: [];
        $data['_updated_at'] = $row['updated_at'];
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        // Belum ada data, kembalikan objek kosong
        echo json_encode(new stdClass());
    }

    $conn->close();
    exit;
}

// ════════════════════════════════════════════════════════════════
// POST — Simpan pengaturan (butuh autentikasi)
// ════════════════════════════════════════════════════════════════
if ($method === 'POST') {

    // ── Baca request body ─────────────────────────────────────
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    if ($data === null && !empty($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Format JSON tidak valid.']);
        $conn->close();
        exit;
    }
    if ($data === null) {
        $data = [];
    }

    // ── Autentikasi ───────────────────────────────────────────
    // Cek Authorization header (berbagai cara untuk kompatibilitas cPanel)
    $authHeader = '';

    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $reqHeaders = apache_request_headers();
        $authHeader = $reqHeaders['Authorization']
                   ?? $reqHeaders['authorization']
                   ?? '';
    }

    // Cek X-Api-Key header sebagai fallback
    if (empty($authHeader) && !empty($_SERVER['HTTP_X_API_KEY'])) {
        $authHeader = 'Bearer ' . $_SERVER['HTTP_X_API_KEY'];
    }

    // Cek _secret dalam body sebagai fallback terakhir (untuk hosting yang tidak pass header)
    $authorized = false;
    if ($authHeader === 'Bearer ' . API_SECRET) {
        $authorized = true;
    } elseif (!empty($data['_secret']) && $data['_secret'] === API_SECRET) {
        $authorized = true;
    }

    // Hapus key internal dari data sebelum disimpan
    unset($data['_updated_at'], $data['_secret']);

    if (!$authorized) {
        http_response_code(401);
        echo json_encode([
            'error' => 'Tidak terotorisasi. Periksa API Secret di Admin Panel → Keamanan.'
        ]);
        $conn->close();
        exit;
    }

    // ── Simpan ke database ────────────────────────────────────
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Data pengaturan kosong.']);
        $conn->close();
        exit;
    }

    $json   = $conn->real_escape_string(
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    $result = $conn->query(
        "INSERT INTO portfolio_settings (id, settings_json, updated_at)
         VALUES (1, '$json', NOW())
         ON DUPLICATE KEY UPDATE
           settings_json = '$json',
           updated_at    = NOW()"
    );

    if ($result) {
        echo json_encode([
            'success'    => true,
            'message'    => 'Pengaturan berhasil disimpan ke database.',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error'   => 'Gagal menyimpan ke database.',
            'details' => $conn->error,
        ]);
    }

    $conn->close();
    exit;
}

// ── Method tidak didukung ────────────────────────────────────────
http_response_code(405);
echo json_encode(['error' => 'HTTP method tidak didukung. Gunakan GET atau POST.']);

