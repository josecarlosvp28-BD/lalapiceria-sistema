<?php

declare(strict_types=1);

namespace App\Tests;

use App\Config\Database;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * Base para pruebas que necesitan una base de datos real. Usa la misma
 * base MySQL configurada en .env (pensada para un `lalapiceria_test` local,
 * nunca la de producción) y limpia todas las tablas antes de cada prueba.
 */
abstract class DbTestCase extends TestCase
{
    protected PDO $db;

    protected function setUp(): void
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
        $dotenv->safeLoad();

        $this->db = Database::get();
        $this->limpiarTablas();
    }

    private function limpiarTablas(): void
    {
        $this->db->exec('SET FOREIGN_KEY_CHECKS = 0');
        $tablas = [
            'caja_diaria', 'cotizaciones_detalle', 'cotizaciones_corporativas',
            'garantias', 'ordenes_grabado', 'ventas_pagos', 'ventas_detalle',
            'ventas', 'inventario_movimientos', 'compras_detalle', 'compras',
            'productos', 'clientes', 'proveedores', 'usuarios',
        ];
        foreach ($tablas as $tabla) {
            $this->db->exec("TRUNCATE TABLE {$tabla}");
        }
        $this->db->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    protected function crearProducto(int $costoCentavos = 1000, int $precioCentavos = 2000, int $stock = 10): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_actual)
             VALUES (?, 'Parker', 'Jotter', 'lapicero', ?, ?, ?)"
        );
        $stmt->execute(['SKU-' . bin2hex(random_bytes(4)), $costoCentavos, $precioCentavos, $stock]);
        return (int) $this->db->lastInsertId();
    }

    protected function crearCliente(string $nombre = 'Cliente de prueba'): int
    {
        $stmt = $this->db->prepare("INSERT INTO clientes (nombre, tipo_cliente) VALUES (?, 'retail')");
        $stmt->execute([$nombre]);
        return (int) $this->db->lastInsertId();
    }
}
