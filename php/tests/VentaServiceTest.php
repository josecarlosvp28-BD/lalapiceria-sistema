<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\VentaException;
use App\Services\VentaService;

final class VentaServiceTest extends DbTestCase
{
    public function testRegistraLaVentaDescuentaStockYGuardaElPago(): void
    {
        $productoId = $this->crearProducto(precioCentavos: 2000, stock: 10);
        $service = new VentaService();

        $venta = $service->crear(
            null,
            null,
            [['producto_id' => $productoId, 'cantidad' => 2, 'precio_unitario_centavos' => 2000, 'descuento_centavos' => 0]],
            0,
            null,
            [['metodo' => 'efectivo', 'monto_centavos' => 4000]]
        );

        $this->assertSame(4000, (int) $venta['total_centavos']);

        $stmt = $this->db->prepare('SELECT stock_actual FROM productos WHERE id = ?');
        $stmt->execute([$productoId]);
        $this->assertSame(8, (int) $stmt->fetchColumn());
    }

    public function testSoportaPagosMixtosQueSumenExactamenteElTotal(): void
    {
        $productoId = $this->crearProducto(precioCentavos: 3000, stock: 10);
        $service = new VentaService();

        $venta = $service->crear(
            null,
            null,
            [['producto_id' => $productoId, 'cantidad' => 1, 'precio_unitario_centavos' => 3000, 'descuento_centavos' => 0]],
            0,
            null,
            [
                ['metodo' => 'efectivo', 'monto_centavos' => 1000],
                ['metodo' => 'tarjeta', 'monto_centavos' => 2000],
            ]
        );

        $this->assertSame(3000, (int) $venta['total_centavos']);
    }

    public function testRechazaLaVentaSiLosPagosNoCuadranConElTotal(): void
    {
        $productoId = $this->crearProducto(precioCentavos: 2000, stock: 10);
        $service = new VentaService();

        $this->expectException(VentaException::class);
        $service->crear(
            null,
            null,
            [['producto_id' => $productoId, 'cantidad' => 1, 'precio_unitario_centavos' => 2000, 'descuento_centavos' => 0]],
            0,
            null,
            [['metodo' => 'efectivo', 'monto_centavos' => 1500]]
        );
    }

    public function testExigeMotivoCuandoHayDescuento(): void
    {
        $productoId = $this->crearProducto(precioCentavos: 2000, stock: 10);
        $service = new VentaService();

        $this->expectException(VentaException::class);
        $this->expectExceptionMessage('motivo del descuento');
        $service->crear(
            null,
            null,
            [['producto_id' => $productoId, 'cantidad' => 1, 'precio_unitario_centavos' => 2000, 'descuento_centavos' => 0]],
            500,
            null,
            [['metodo' => 'efectivo', 'monto_centavos' => 1500]]
        );
    }

    public function testNoPermiteVenderMasUnidadesQueElStockDisponible(): void
    {
        $productoId = $this->crearProducto(precioCentavos: 2000, stock: 1);
        $service = new VentaService();

        $this->expectException(\Throwable::class);
        try {
            $service->crear(
                null,
                null,
                [['producto_id' => $productoId, 'cantidad' => 5, 'precio_unitario_centavos' => 2000, 'descuento_centavos' => 0]],
                0,
                null,
                [['metodo' => 'efectivo', 'monto_centavos' => 10000]]
            );
        } finally {
            $stmt = $this->db->prepare('SELECT stock_actual FROM productos WHERE id = ?');
            $stmt->execute([$productoId]);
            $this->assertSame(1, (int) $stmt->fetchColumn(), 'el stock no debe cambiar si la venta falla y hace rollback');
        }
    }
}
