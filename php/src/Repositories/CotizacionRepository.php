<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class CotizacionRepository
{
    /** @return array<int, array<string, mixed>> */
    public function listar(): array
    {
        $stmt = Database::get()->query(
            'SELECT cc.*, c.nombre as cliente_nombre
             FROM cotizaciones_corporativas cc
             JOIN clientes c ON c.id = cc.cliente_id
             ORDER BY cc.fecha_creacion DESC'
        );
        return $stmt->fetchAll();
    }

    public function obtenerCabecera(int $id): ?array
    {
        $stmt = Database::get()->prepare(
            'SELECT cc.*, c.nombre as cliente_nombre FROM cotizaciones_corporativas cc
             JOIN clientes c ON c.id = cc.cliente_id WHERE cc.id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @return array<int, array<string, mixed>> */
    public function items(int $cotizacionId): array
    {
        $stmt = Database::get()->prepare(
            'SELECT cd.*, p.marca, p.modelo FROM cotizaciones_detalle cd
             JOIN productos p ON p.id = cd.producto_id
             WHERE cd.cotizacion_id = ?'
        );
        $stmt->execute([$cotizacionId]);
        return $stmt->fetchAll();
    }

    public function insertarCabecera(int $clienteId, ?string $descripcion, int $totalCentavos, ?string $fechaEntregaEstimada, ?string $notas): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO cotizaciones_corporativas (cliente_id, descripcion, total_centavos, fecha_entrega_estimada, notas)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$clienteId, $descripcion, $totalCentavos, $fechaEntregaEstimada ?: null, $notas]);
        return (int) Database::get()->lastInsertId();
    }

    public function insertarItem(int $cotizacionId, int $productoId, int $cantidad, int $precioUnitarioCentavos): void
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO cotizaciones_detalle (cotizacion_id, producto_id, cantidad, precio_unitario_centavos)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$cotizacionId, $productoId, $cantidad, $precioUnitarioCentavos]);
    }

    public function cambiarEstado(int $id, string $estado): void
    {
        $stmt = Database::get()->prepare(
            "UPDATE cotizaciones_corporativas SET estado = ?, updated_at = NOW() WHERE id = ?"
        );
        $stmt->execute([$estado, $id]);
    }
}
