<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\ProductoService;
use PHPUnit\Framework\TestCase;

final class ProductoServiceTest extends TestCase
{
    public function testCalculaElMargenCorrectamente(): void
    {
        $service = new ProductoService();
        // costo 1000 centavos, precio 2000 centavos -> 50% de margen
        $this->assertSame(50.0, $service->calcularMargen(1000, 2000));
    }

    public function testDevuelveCeroSiElPrecioEsCero(): void
    {
        $service = new ProductoService();
        $this->assertSame(0.0, $service->calcularMargen(1000, 0));
    }

    public function testPermiteMargenNegativoCuandoSeVendeBajoCosto(): void
    {
        $service = new ProductoService();
        $this->assertSame(-100.0, $service->calcularMargen(2000, 1000));
    }
}
