<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class CajaRepository
{
    public function cajaAbierta(): ?array
    {
        $stmt = Database::get()->query(
            "SELECT * FROM caja_diaria WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1"
        );
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function insertarApertura(int $montoAperturaCentavos, ?int $usuarioAperturaId): int
    {
        $stmt = Database::get()->prepare(
            "INSERT INTO caja_diaria (usuario_apertura_id, monto_apertura_centavos, estado) VALUES (?, ?, 'abierta')"
        );
        $stmt->execute([$usuarioAperturaId, $montoAperturaCentavos]);
        return (int) Database::get()->lastInsertId();
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM caja_diaria WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function ventasEfectivoDesde(string $desde): int
    {
        $stmt = Database::get()->prepare(
            "SELECT COALESCE(SUM(vp.monto_centavos), 0) as total
             FROM ventas_pagos vp
             JOIN ventas v ON v.id = vp.venta_id
             WHERE vp.metodo = 'efectivo' AND v.estado = 'completada' AND v.fecha >= ?"
        );
        $stmt->execute([$desde]);
        return (int) $stmt->fetchColumn();
    }

    public function cerrar(int $id, ?int $usuarioCierreId, int $montoEsperado, int $montoReal, int $diferencia, ?string $notas): void
    {
        $stmt = Database::get()->prepare(
            "UPDATE caja_diaria SET
                estado = 'cerrada', usuario_cierre_id = ?, monto_cierre_esperado_centavos = ?,
                monto_cierre_real_centavos = ?, diferencia_centavos = ?, notas = ?, updated_at = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$usuarioCierreId, $montoEsperado, $montoReal, $diferencia, $notas, $id]);
    }

    /** @return array<int, array<string, mixed>> */
    public function historial(): array
    {
        $stmt = Database::get()->query('SELECT * FROM caja_diaria ORDER BY fecha DESC LIMIT 60');
        return $stmt->fetchAll();
    }
}
