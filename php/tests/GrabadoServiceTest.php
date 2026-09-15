<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\GrabadoService;

final class GrabadoServiceTest extends DbTestCase
{
    public function testUnaOrdenNuevaEmpiezaEnEstadoRecibido(): void
    {
        $clienteId = $this->crearCliente();
        $productoId = $this->crearProducto();
        $service = new GrabadoService();

        $orden = $service->crear([
            'cliente_id' => $clienteId,
            'producto_id' => $productoId,
            'texto_grabado' => 'Para Juan, con cariño',
            'costo_adicional_centavos' => 500,
        ]);

        $this->assertSame('recibido', $orden['estado']);
        $this->assertNull($orden['fecha_entrega_real']);
    }

    public function testSigueElFlujoCompletoHastaEntregado(): void
    {
        $service = new GrabadoService();
        $this->assertSame('en_proceso', $service->siguienteEstado('recibido'));
        $this->assertSame('control_calidad', $service->siguienteEstado('en_proceso'));
        $this->assertSame('listo', $service->siguienteEstado('control_calidad'));
        $this->assertSame('entregado', $service->siguienteEstado('listo'));
        $this->assertNull($service->siguienteEstado('entregado'));
    }

    public function testMarcarComoEntregadoRegistraLaFechaDeEntregaReal(): void
    {
        $clienteId = $this->crearCliente();
        $productoId = $this->crearProducto();
        $service = new GrabadoService();

        $orden = $service->crear([
            'cliente_id' => $clienteId,
            'producto_id' => $productoId,
            'texto_grabado' => 'Iniciales JP',
        ]);

        $actualizada = $service->cambiarEstado((int) $orden['id'], 'entregado');
        $this->assertSame('entregado', $actualizada['estado']);
        $this->assertNotNull($actualizada['fecha_entrega_real']);
    }
}
