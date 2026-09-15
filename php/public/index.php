<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\CajaController;
use App\Controllers\ClienteController;
use App\Controllers\CotizacionController;
use App\Controllers\DashboardController;
use App\Controllers\GarantiaController;
use App\Controllers\GrabadoController;
use App\Controllers\InventarioController;
use App\Controllers\ProductoController;
use App\Controllers\VentaController;
use App\Http\Json;
use App\Http\SessionAuth;
use App\Router;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

SessionAuth::start();

$router = new Router();

// --- Autenticación ---
$router->post('/api/auth/login', fn () => (new AuthController())->login(), auth: false);
$router->post('/api/auth/logout', fn () => (new AuthController())->logout(), auth: false);
$router->get('/api/auth/me', fn () => (new AuthController())->me(), auth: false);

// --- Usuarios ---
$router->get('/api/usuarios', fn () => (new AuthController())->listar());
$router->post('/api/usuarios', fn () => (new AuthController())->crear());
$router->put('/api/usuarios/{id}/estado', fn (array $p) => (new AuthController())->cambiarEstado($p['id']));

// --- Productos ---
$router->get('/api/productos/stock-bajo', fn () => (new ProductoController())->stockBajo());
$router->get('/api/productos/{id}', fn (array $p) => (new ProductoController())->obtener($p['id']));
$router->get('/api/productos', fn () => (new ProductoController())->listar());
$router->post('/api/productos', fn () => (new ProductoController())->crear());
$router->put('/api/productos/{id}', fn (array $p) => (new ProductoController())->actualizar($p['id']));

// --- Inventario ---
$router->post('/api/inventario/movimientos', fn () => (new InventarioController())->registrarMovimiento());
$router->get('/api/inventario/productos/{id}/historial', fn (array $p) => (new InventarioController())->historial($p['id']));

// --- Clientes ---
$router->get('/api/clientes/seguimiento', fn () => (new ClienteController())->paraSeguimiento());
$router->get('/api/clientes/por-marca', fn () => (new ClienteController())->porMarcaComprada());
$router->get('/api/clientes/cumpleanos', fn () => (new ClienteController())->proximosCumpleanos());
$router->get('/api/clientes/{id}/compras', fn (array $p) => (new ClienteController())->historialCompras($p['id']));
$router->get('/api/clientes/{id}', fn (array $p) => (new ClienteController())->obtener($p['id']));
$router->get('/api/clientes', fn () => (new ClienteController())->listar());
$router->post('/api/clientes', fn () => (new ClienteController())->crear());
$router->put('/api/clientes/{id}', fn (array $p) => (new ClienteController())->actualizar($p['id']));

// --- Ventas ---
$router->get('/api/ventas/reportes/mas-vendidos', fn () => (new VentaController())->reporteMasVendidos());
$router->get('/api/ventas/reportes/por-periodo', fn () => (new VentaController())->reportePorPeriodo());
$router->get('/api/ventas/reportes/por-marca', fn () => (new VentaController())->reportePorMarca());
$router->get('/api/ventas/reportes/por-categoria', fn () => (new VentaController())->reportePorCategoria());
$router->get('/api/ventas/reportes/margen', fn () => (new VentaController())->reporteMargen());
$router->get('/api/ventas/reportes/comparativo', fn () => (new VentaController())->resumenComparativo());
$router->post('/api/ventas/{id}/anular', fn (array $p) => (new VentaController())->anular($p['id']));
$router->get('/api/ventas/{id}', fn (array $p) => (new VentaController())->detalle($p['id']));
$router->get('/api/ventas', fn () => (new VentaController())->listar());
$router->post('/api/ventas', fn () => (new VentaController())->crear());

// --- Grabados ---
$router->get('/api/grabados/listas-para-entrega', fn () => (new GrabadoController())->listasParaEntrega());
$router->get('/api/grabados/clientes/{id}/historial', fn (array $p) => (new GrabadoController())->historialCliente($p['id']));
$router->put('/api/grabados/{id}/estado', fn (array $p) => (new GrabadoController())->cambiarEstado($p['id']));
$router->get('/api/grabados/{id}', fn (array $p) => (new GrabadoController())->obtener($p['id']));
$router->get('/api/grabados', fn () => (new GrabadoController())->listar());
$router->post('/api/grabados', fn () => (new GrabadoController())->crear());

// --- Cotizaciones ---
$router->get('/api/cotizaciones/{id}/pdf', fn (array $p) => (new CotizacionController())->pdf($p['id']));
$router->put('/api/cotizaciones/{id}/estado', fn (array $p) => (new CotizacionController())->cambiarEstado($p['id']));
$router->get('/api/cotizaciones/{id}', fn (array $p) => (new CotizacionController())->obtener($p['id']));
$router->get('/api/cotizaciones', fn () => (new CotizacionController())->listar());
$router->post('/api/cotizaciones', fn () => (new CotizacionController())->crear());

// --- Garantías ---
$router->put('/api/garantias/{id}/estado', fn (array $p) => (new GarantiaController())->cambiarEstado($p['id']));
$router->get('/api/garantias', fn () => (new GarantiaController())->listar());
$router->post('/api/garantias', fn () => (new GarantiaController())->crear());

// --- Caja diaria ---
$router->get('/api/caja/actual', fn () => (new CajaController())->actual());
$router->get('/api/caja/monto-esperado', fn () => (new CajaController())->montoEsperado());
$router->post('/api/caja/abrir', fn () => (new CajaController())->abrir());
$router->post('/api/caja/cerrar', fn () => (new CajaController())->cerrar());
$router->get('/api/caja/historial', fn () => (new CajaController())->historial());

// --- Dashboard ---
$router->get('/api/dashboard/resumen', fn () => (new DashboardController())->resumenGeneral());
$router->get('/api/dashboard/rotacion-inventario', fn () => (new DashboardController())->rotacionInventario());
$router->get('/api/dashboard/clientes-nuevos-recurrentes', fn () => (new DashboardController())->clientesNuevosVsRecurrentes());
$router->get('/api/dashboard/ingresos-por-canal', fn () => (new DashboardController())->ingresosPorCanal());

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
