<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class InventarioRepository
{
    public function stockActual(int $productoId): ?int
    {
        $stmt = Database::get()->prepare('SELECT stock_actual FROM productos WHERE id = ?');
        $stmt->execute([$productoId]);
        $row = $stmt->fetch();
        return $row === false ? null : (int) $row['stock_actual'];
    }

    public function actualizarStock(int $productoId, int $nuevoStock): void
    {
        $stmt = Database::get()->prepare('UPDATE productos SET stock_actual = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$nuevoStock, $productoId]);
    }

    /** @return array<string, mixed> */
    public function insertarMovimiento(
        int $productoId,
        string $tipo,
        int $cantidad,
        ?string $motivo,
        ?string $referenciaTipo,
        ?int $referenciaId,
        ?int $usuarioId
    ): array {
        $stmt = Database::get()->prepare(
            'INSERT INTO inventario_movimientos
                (producto_id, tipo, cantidad, motivo, referencia_tipo, referencia_id, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$productoId, $tipo, $cantidad, $motivo, $referenciaTipo, $referenciaId, $usuarioId]);
        $id = (int) Database::get()->lastInsertId();

        $stmt = Database::get()->prepare('SELECT * FROM inventario_movimientos WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /** @return array<int, array<string, mixed>> */
    public function historial(int $productoId): array
    {
        $stmt = Database::get()->prepare(
            'SELECT * FROM inventario_movimientos WHERE producto_id = ? ORDER BY created_at DESC'
        );
        $stmt->execute([$productoId]);
        return $stmt->fetchAll();
    }
}
