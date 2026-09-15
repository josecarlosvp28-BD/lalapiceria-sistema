<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Repositories\VentaRepository;
use RuntimeException;

final class VentaException extends RuntimeException
{
}

final class VentaService
{
    public function __construct(
        private VentaRepository $ventas = new VentaRepository(),
        private InventarioService $inventario = new InventarioService()
    ) {
    }

    /**
     * @param array<int, array{producto_id: int, cantidad: int, precio_unitario_centavos: int, descuento_centavos: int}> $items
     * @param array<int, array{metodo: string, monto_centavos: int}> $pagos
     */
    public function crear(
        ?int $clienteId,
        ?int $usuarioId,
        array $items,
        int $descuentoCentavos,
        ?string $descuentoMotivo,
        array $pagos
    ): array {
        if (count($items) === 0) {
            throw new VentaException('La venta debe tener al menos un producto');
        }
        if ($descuentoCentavos > 0 && !$descuentoMotivo) {
            throw new VentaException('Debe indicar el motivo del descuento');
        }

        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += $item['precio_unitario_centavos'] * $item['cantidad'] - $item['descuento_centavos'];
        }
        $total = $subtotal - $descuentoCentavos;

        $totalPagos = array_sum(array_column($pagos, 'monto_centavos'));
        if ($totalPagos !== $total) {
            throw new VentaException("Los pagos ({$totalPagos}) no coinciden con el total de la venta ({$total})");
        }

        $pdo = Database::get();
        $pdo->beginTransaction();

        try {
            $ventaId = $this->ventas->insertarVenta($clienteId, $usuarioId, $subtotal, $descuentoCentavos, $descuentoMotivo, $total);

            foreach ($items as $item) {
                $itemSubtotal = $item['precio_unitario_centavos'] * $item['cantidad'] - $item['descuento_centavos'];
                $this->ventas->insertarDetalle(
                    $ventaId,
                    $item['producto_id'],
                    $item['cantidad'],
                    $item['precio_unitario_centavos'],
                    $item['descuento_centavos'],
                    $itemSubtotal
                );

                $this->inventario->registrarMovimiento(
                    $item['producto_id'],
                    'salida',
                    $item['cantidad'],
                    'Venta',
                    'venta',
                    $ventaId,
                    $usuarioId
                );
            }

            foreach ($pagos as $pago) {
                $this->ventas->insertarPago($ventaId, $pago['metodo'], $pago['monto_centavos']);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return $this->ventas->obtener($ventaId) ?? [];
    }

    public function anular(int $ventaId, ?int $usuarioId, string $motivo): array
    {
        $venta = $this->ventas->obtener($ventaId);
        if ($venta === null) {
            throw new VentaException('Venta no encontrada');
        }
        if ($venta['estado'] === 'anulada') {
            throw new VentaException('La venta ya está anulada');
        }

        $pdo = Database::get();
        $pdo->beginTransaction();

        try {
            foreach ($this->ventas->itemsDeVenta($ventaId) as $item) {
                $this->inventario->registrarMovimiento(
                    (int) $item['producto_id'],
                    'entrada',
                    (int) $item['cantidad'],
                    "Anulación de venta #{$ventaId}: {$motivo}",
                    'devolucion',
                    $ventaId,
                    $usuarioId
                );
            }
            $this->ventas->marcarAnulada($ventaId);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return $this->ventas->obtener($ventaId) ?? [];
    }

    public function listar(?string $desde, ?string $hasta): array
    {
        return $this->ventas->listar($desde, $hasta);
    }

    public function detalle(int $id): array
    {
        return $this->ventas->detalle($id);
    }

    public function reporteMasVendidos(string $desde, string $hasta): array
    {
        return $this->ventas->reporteMasVendidos($desde, $hasta);
    }

    public function reportePorPeriodo(string $desde, string $hasta, string $agrupacion): array
    {
        return $this->ventas->reportePorPeriodo($desde, $hasta, $agrupacion);
    }

    public function reportePorMarca(string $desde, string $hasta): array
    {
        return $this->ventas->reportePorMarca($desde, $hasta);
    }

    public function reportePorCategoria(string $desde, string $hasta): array
    {
        return $this->ventas->reportePorCategoria($desde, $hasta);
    }

    public function reporteMargen(string $desde, string $hasta, string $agrupacion): array
    {
        return $this->ventas->reporteMargenPorPeriodo($desde, $hasta, $agrupacion);
    }

    public function resumenComparativo(string $desde, string $hasta, string $desdeAnterior, string $hastaAnterior): array
    {
        return [
            'actual' => $this->ventas->resumenPeriodo($desde, $hasta),
            'anterior' => $this->ventas->resumenPeriodo($desdeAnterior, $hastaAnterior),
        ];
    }
}
