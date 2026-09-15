<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class GrabadoRepository
{
    /** @return array<int, array<string, mixed>> */
    public function listar(?string $estado): array
    {
        $where = $estado ? 'WHERE og.estado = ?' : '';
        $stmt = Database::get()->prepare(
            "SELECT og.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, p.marca, p.modelo
             FROM ordenes_grabado og
             JOIN clientes c ON c.id = og.cliente_id
             JOIN productos p ON p.id = og.producto_id
             {$where}
             ORDER BY
               FIELD(og.estado, 'recibido', 'en_proceso', 'control_calidad', 'listo', 'entregado'),
               og.fecha_recepcion DESC"
        );
        $stmt->execute($estado ? [$estado] : []);
        return $stmt->fetchAll();
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM ordenes_grabado WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @param array<string, mixed> $input */
    public function crear(array $input): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO ordenes_grabado
                (cliente_id, producto_id, venta_id, texto_grabado, tipo_fuente, posicion, imagen_referencia_path,
                 fecha_entrega_estimada, responsable_id, costo_adicional_centavos, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['cliente_id'], $input['producto_id'], $input['venta_id'] ?? null,
            $input['texto_grabado'], $input['tipo_fuente'] ?? null, $input['posicion'] ?? null,
            $input['imagen_referencia_path'] ?? null, $input['fecha_entrega_estimada'] ?? null,
            $input['responsable_id'] ?? null, $input['costo_adicional_centavos'] ?? 0, $input['notas'] ?? null,
        ]);
        return (int) Database::get()->lastInsertId();
    }

    public function cambiarEstado(int $id, string $estado): void
    {
        if ($estado === 'entregado') {
            $stmt = Database::get()->prepare(
                "UPDATE ordenes_grabado SET estado = ?, fecha_entrega_real = NOW(), updated_at = NOW() WHERE id = ?"
            );
        } else {
            $stmt = Database::get()->prepare('UPDATE ordenes_grabado SET estado = ?, updated_at = NOW() WHERE id = ?');
        }
        $stmt->execute([$estado, $id]);
    }

    /** @return array<int, array<string, mixed>> */
    public function listasParaEntrega(): array
    {
        $stmt = Database::get()->query(
            "SELECT og.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, p.marca, p.modelo
             FROM ordenes_grabado og
             JOIN clientes c ON c.id = og.cliente_id
             JOIN productos p ON p.id = og.producto_id
             WHERE og.estado = 'listo'
             ORDER BY og.updated_at"
        );
        return $stmt->fetchAll();
    }

    /** @return array<int, array<string, mixed>> */
    public function historialCliente(int $clienteId): array
    {
        $stmt = Database::get()->prepare(
            'SELECT og.*, p.marca, p.modelo FROM ordenes_grabado og
             JOIN productos p ON p.id = og.producto_id
             WHERE og.cliente_id = ?
             ORDER BY og.fecha_recepcion DESC'
        );
        $stmt->execute([$clienteId]);
        return $stmt->fetchAll();
    }
}
