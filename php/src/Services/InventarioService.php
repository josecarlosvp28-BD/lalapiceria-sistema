<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Repositories\InventarioRepository;
use RuntimeException;

final class InventarioException extends RuntimeException
{
}

final class InventarioService
{
    public function __construct(private InventarioRepository $inventario = new InventarioRepository())
    {
    }

    /**
     * Única forma permitida de cambiar stock: siempre queda un registro en
     * inventario_movimientos, nunca se sobreescribe stock_actual directamente.
     * Ejecuta dentro de una transacción propia salvo que ya haya una activa
     * (para poder anidarse dentro de VentaService::crear, por ejemplo).
     *
     * @return array<string, mixed>
     */
    public function registrarMovimiento(
        int $productoId,
        string $tipo,
        int $cantidad,
        ?string $motivo = null,
        ?string $referenciaTipo = null,
        ?int $referenciaId = null,
        ?int $usuarioId = null
    ): array {
        $pdo = Database::get();
        $propiaTransaccion = !$pdo->inTransaction();
        if ($propiaTransaccion) {
            $pdo->beginTransaction();
        }

        try {
            $stockActual = $this->inventario->stockActual($productoId);
            if ($stockActual === null) {
                throw new InventarioException('Producto no encontrado');
            }

            $delta = in_array($tipo, ['entrada', 'ajuste'], true) ? $cantidad : -$cantidad;
            $nuevoStock = $stockActual + $delta;

            if ($nuevoStock < 0) {
                throw new InventarioException('Stock insuficiente para esta operación');
            }

            $this->inventario->actualizarStock($productoId, $nuevoStock);
            $movimiento = $this->inventario->insertarMovimiento(
                $productoId,
                $tipo,
                $cantidad,
                $motivo,
                $referenciaTipo,
                $referenciaId,
                $usuarioId
            );

            if ($propiaTransaccion) {
                $pdo->commit();
            }

            return $movimiento;
        } catch (\Throwable $e) {
            if ($propiaTransaccion && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /** @return array<int, array<string, mixed>> */
    public function historial(int $productoId): array
    {
        return $this->inventario->historial($productoId);
    }
}
