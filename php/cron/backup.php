<?php

// Respaldo de la base de datos. Pensado para ejecutarse como Cron Job de
// Hostinger (hPanel → Avanzado → Cron Jobs), NO como una ruta HTTP —
// reemplaza al `setInterval` de 6 horas que corría en el proceso Node,
// que no tiene equivalente en hosting compartido (ver MIGRATION_AUDIT.md, sección 4).
//
// Ejemplo de comando para el cron job (cada 6 horas):
//   php /home/usuario/lalapiceria/php/cron/backup.php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Este script solo puede ejecutarse por línea de comandos (cron).');
}

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$name = $_ENV['DB_NAME'] ?? '';
$user = $_ENV['DB_USER'] ?? '';
$pass = $_ENV['DB_PASS'] ?? '';

$backupDir = rtrim($_ENV['BACKUP_DIR'] ?? (__DIR__ . '/../../backups'), '/');
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$timestamp = date('Y-m-d\THis');
$archivo = "{$backupDir}/lalapiceria-{$timestamp}.sql";

$comando = sprintf(
    'mysqldump --host=%s --user=%s --password=%s %s > %s 2>&1',
    escapeshellarg($host),
    escapeshellarg($user),
    escapeshellarg($pass),
    escapeshellarg($name),
    escapeshellarg($archivo)
);

exec($comando, $salida, $codigo);

if ($codigo !== 0) {
    fwrite(STDERR, "Error al respaldar la base de datos:\n" . implode("\n", $salida) . "\n");
    exit(1);
}

echo "Respaldo creado: {$archivo}\n";

// Conserva solo los últimos 30 respaldos
$archivos = glob("{$backupDir}/lalapiceria-*.sql") ?: [];
sort($archivos);
$maxRespaldos = 30;
while (count($archivos) > $maxRespaldos) {
    $viejo = array_shift($archivos);
    unlink($viejo);
    echo "Respaldo antiguo eliminado: {$viejo}\n";
}
