<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ProductoRepository;
use RuntimeException;

final class ProductoException extends RuntimeException
{
}

final class ProductoService
{
    public function __construct(private ProductoRepository $productos = new ProductoRepository())
    {
    }

    /** @return array<int, array<string, mixed>> */
    public function listar(array $filtros = []): array
    {
        return $this->productos->listar($filtros);
    }

    public function obtener(int $id): ?array
    {
        return $this->productos->obtener($id);
    }

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): array
    {
        $this->validar($datos);
        if ($this->productos->obtenerPorSku($datos['sku']) !== null) {
            throw new ProductoException('Ya existe un producto con ese SKU');
        }
        $id = $this->productos->crear($datos);
        return $this->productos->obtener($id) ?? [];
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): array
    {
        $actual = $this->productos->obtener($id);
        if ($actual === null) {
            throw new ProductoException('Producto no encontrado');
        }
        $fusionado = array_merge($actual, $datos);
        $this->validar($fusionado);
        $this->productos->actualizar($id, $fusionado);
        return $this->productos->obtener($id) ?? [];
    }

    /** @return array<int, array<string, mixed>> */
    public function stockBajo(): array
    {
        return $this->productos->stockBajo();
    }

    /**
     * Margen porcentual: (precio - costo) / precio * 100, redondeado a 2 decimales.
     * Devuelve 0 si el precio es 0, para evitar división entre cero.
     */
    public function calcularMargen(int $costoCentavos, int $precioCentavos): float
    {
        if ($precioCentavos === 0) {
            return 0.0;
        }
        return round((($precioCentavos - $costoCentavos) / $precioCentavos) * 10000) / 100;
    }

    /** @param array<string, mixed> $datos */
    private function validar(array $datos): void
    {
        foreach (['sku', 'marca', 'modelo', 'categoria'] as $campo) {
            if (empty($datos[$campo])) {
                throw new ProductoException("El campo '{$campo}' es obligatorio");
            }
        }
        $categoriasValidas = ['lapicero', 'pluma_fuente', 'roller', 'portaminas', 'accesorio', 'estuche'];
        if (!in_array($datos['categoria'], $categoriasValidas, true)) {
            throw new ProductoException('Categoría inválida');
        }
    }
}
