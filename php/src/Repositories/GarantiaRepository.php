<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class GarantiaRepository
{
    /** @return array<int, array<string, mixed>> */
    public function listar(?string $estado): array
    {
        $where = $estado ? 'WHERE g.estado = ?' : '';
        $stmt = Database::get()->prepare(
            "SELECT g.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
             FROM garantias g
             JOIN clientes c ON c.id = g.cliente_id
             {$where}
             ORDER BY g.fecha_ingreso DESC"
        );
        $stmt->execute($estado ? [$estado] : []);
        return $stmt->fetchAll();
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM garantias WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @param array<string, mixed> $input */
    public function crear(array $input): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO garantias (cliente_id, producto_id, venta_id, marca, falla, notas)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['cliente_id'], $input['producto_id'] ?? null, $input['venta_id'] ?? null,
            $input['marca'] ?? null, $input['falla'], $input['notas'] ?? null,
        ]);
        return (int) Database::get()->lastInsertId();
    }

    public function cambiarEstado(int $id, string $estado): void
    {
        if ($estado === 'entregado') {
            $stmt = Database::get()->prepare(
                'UPDATE garantias SET estado = ?, fecha_entrega = NOW(), updated_at = NOW() WHERE id = ?'
            );
        } else {
            $stmt = Database::get()->prepare('UPDATE garantias SET estado = ?, updated_at = NOW() WHERE id = ?');
        }
        $stmt->execute([$estado, $id]);
    }
}
