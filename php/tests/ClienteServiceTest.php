<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\ClienteException;
use App\Services\ClienteService;

final class ClienteServiceTest extends DbTestCase
{
    public function testCreaUnClienteSinFechaDeNacimientoSinAdvertenciasPhp(): void
    {
        $service = new ClienteService();
        $cliente = $service->crear(['nombre' => 'Ana Torres', 'tipo_cliente' => 'retail']);
        $this->assertSame('Ana Torres', $cliente['nombre']);
        $this->assertNull($cliente['fecha_nacimiento']);
    }

    public function testExigeNombreAlCrear(): void
    {
        $service = new ClienteService();
        $this->expectException(ClienteException::class);
        $service->crear(['nombre' => '']);
    }
}
