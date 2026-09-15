<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\CajaException;
use App\Services\CajaService;
use App\Services\VentaService;

final class CajaServiceTest extends DbTestCase
{
    public function testNoPermiteAbrirUnaSegundaCajaSiYaHayUnaAbierta(): void
    {
        $service = new CajaService();
        $service->abrir(10000, null);

        $this->expectException(CajaException::class);
        $service->abrir(5000, null);
    }

    public function testElMontoEsperadoAlCerrarEsAperturaMasVentasEnEfectivo(): void
    {
        $caja = new CajaService();
        $caja->abrir(10000, null); // S/ 100.00 de apertura

        $productoId = $this->crearProducto(precioCentavos: 5000, stock: 10);
        $ventas = new VentaService();

        $ventas->crear(null, null, [
            ['producto_id' => $productoId, 'cantidad' => 1, 'precio_unitario_centavos' => 5000, 'descuento_centavos' => 0],
        ], 0, null, [['metodo' => 'efectivo', 'monto_centavos' => 5000]]);

        $ventas->crear(null, null, [
            ['producto_id' => $productoId, 'cantidad' => 1, 'precio_unitario_centavos' => 5000, 'descuento_centavos' => 0],
        ], 0, null, [['metodo' => 'tarjeta', 'monto_centavos' => 5000]]);

        // Cierra contando exactamente lo esperado: 100 (apertura) + 50 (venta en efectivo) = 150
        $cerrada = $caja->cerrar(15000, null, null);

        $this->assertSame(15000, (int) $cerrada['monto_cierre_esperado_centavos']);
        $this->assertSame(0, (int) $cerrada['diferencia_centavos']);
    }

    public function testRegistraUnaDiferenciaCuandoElConteoRealNoCoincide(): void
    {
        $service = new CajaService();
        $service->abrir(10000, null);

        $cerrada = $service->cerrar(9500, null, 'faltante de caja chica');

        $this->assertSame(10000, (int) $cerrada['monto_cierre_esperado_centavos']);
        $this->assertSame(-500, (int) $cerrada['diferencia_centavos']);
    }

    public function testNoPermiteCerrarSiNoHayCajaAbierta(): void
    {
        $service = new CajaService();
        $this->expectException(CajaException::class);
        $service->cerrar(1000, null, null);
    }
}
