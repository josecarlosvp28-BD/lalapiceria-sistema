<?php
// Enrutador SOLO para `php -S` en desarrollo local — replica las reglas de
// .htaccess (que Apache sí aplica en producción) porque el servidor
// integrado de PHP no lee .htaccess. No se usa en el hosting real.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$archivo = __DIR__ . $path;

if ($path !== '/' && file_exists($archivo) && !is_dir($archivo)) {
    return false; // deja que el servidor integrado sirva el archivo estático tal cual
}

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/index.php';
    return true;
}

readfile(__DIR__ . '/index.html');
return true;
