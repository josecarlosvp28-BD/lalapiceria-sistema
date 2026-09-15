<?php

// Script de línea de comandos: crea el usuario administrador inicial.
// Se ejecuta UNA sola vez, manualmente, por SSH tras desplegar:
//   php bin/seed-admin.php
// No se ejecuta automáticamente en cada petición HTTP (a diferencia de la
// versión Node, que sembraba el admin al primer arranque del proceso) para
// evitar exponer una contraseña generada en una respuesta HTTP.

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Services\AuthService;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$resultado = (new AuthService())->sembrarAdminSiVacio();

if ($resultado === null) {
    echo "Ya existe al menos un usuario. No se creó ningún administrador nuevo.\n";
    exit(0);
}

echo "Usuario administrador creado:\n";
echo "  Correo:      {$resultado['email']}\n";
echo "  Contraseña:  {$resultado['password']}\n";
echo "\nGuarda esta contraseña ahora — no se mostrará de nuevo. Cámbiala después de iniciar sesión.\n";
