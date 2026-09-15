<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\InventarioException;
use App\Services\InventarioService;

final class InventarioServiceTest extends DbTestCase
{
    public function testUnaEntradaIncrementaElStockYQuedaRegistrada(): void
    {
        $productoId = $this->crearProducto(stock: 0);
        $service = new InventarioService();

        $service->registrarMovimiento($productoId, 'entrada', 10, 'Compra inicial');

        $stmt = $this->db->prepare('SELECT stock_actual FROM productos WHERE id = ?');
        $stmt->execute([$productoId]);
        $this->assertSame(10, (int) $stmt->fetchColumn());

        $historial = $service->historial($productoId);
        $this->assertCount(1, $historial);
        $this->assertSame('entrada', $historial[0]['tipo']);
    }

    public function testUnaSalidaReduceElStock(): void
    {
        $productoId = $this->crearProducto(stock: 0);
        $service = new InventarioService();

        $service->registrarMovimiento($productoId, 'entrada', 10);
        $service->registrarMovimiento($productoId, 'salida', 3, 'Venta');

        $stmt = $this->db->prepare('SELECT stock_actual FROM productos WHERE id = ?');
        $stmt->execute([$productoId]);
        $this->assertSame(7, (int) $stmt->fetchColumn());
    }

    public function testNuncaPermiteQueElStockQuedeNegativo(): void
    {
        $productoId = $this->crearProducto(stock: 0);
        $service = new InventarioService();

        $service->registrarMovimiento($productoId, 'entrada', 2);

        $this->expectException(InventarioException::class);
        $this->expectExceptionMessage('Stock insuficiente');
        $service->registrarMovimiento($productoId, 'salida', 5);
    }
}
