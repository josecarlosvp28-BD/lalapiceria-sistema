<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\ProductoController;
use App\Http\Json;
use App\Http\SessionAuth;
use App\Router;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

SessionAuth::start();

$router = new Router();

// --- Autenticación (no requiere sesión previa, salvo /me que la usa para leerla) ---
$router->post('/api/auth/login', fn () => (new AuthController())->login(), auth: false);
$router->post('/api/auth/logout', fn () => (new AuthController())->logout(), auth: false);
$router->get('/api/auth/me', fn () => (new AuthController())->me(), auth: false);

// --- Usuarios (requiere sesión) ---
$router->get('/api/usuarios', fn () => (new AuthController())->listar());
$router->post('/api/usuarios', fn () => (new AuthController())->crear());
$router->put('/api/usuarios/{id}/estado', fn (array $p) => (new AuthController())->cambiarEstado($p['id']));

// --- Productos (requiere sesión) ---
$router->get('/api/productos/stock-bajo', fn () => (new ProductoController())->stockBajo());
$router->get('/api/productos/{id}', fn (array $p) => (new ProductoController())->obtener($p['id']));
$router->get('/api/productos', fn () => (new ProductoController())->listar());
$router->post('/api/productos', fn () => (new ProductoController())->crear());
$router->put('/api/productos/{id}', fn (array $p) => (new ProductoController())->actualizar($p['id']));

// --- Despacho ---
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

$match = $router->match($method, $path);

if (!$match['matched']) {
    Json::error('Ruta no encontrada', 404);
}

if ($match['auth']) {
    SessionAuth::requireAuth();
}

($match['handler'])($match['params']);
