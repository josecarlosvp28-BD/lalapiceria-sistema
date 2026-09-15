<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class DashboardRepository
{
    /** @return array{num_ventas: int, ingresos_centavos: int, ticket_promedio_centavos: float} */
    public function resumenGeneral(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT COUNT(*) as num_ventas, COALESCE(SUM(total_centavos), 0) as ingresos_centavos,
                    COALESCE(AVG(total_centavos), 0) as ticket_promedio_centavos
             FROM ventas WHERE estado = 'completada' AND fecha BETWEEN ? AND ?"
        );
        $stmt->execute([$desde, $hasta]);
        $row = $stmt->fetch();
        return [
            'num_ventas' => (int) $row['num_ventas'],
            'ingresos_centavos' => (int) $row['ingresos_centavos'],
            'ticket_promedio_centavos' => (float) $row['ticket_promedio_centavos'],
        ];
    }

    public function costoVendido(string $desde, string $hasta): int
    {
        $stmt = Database::get()->prepare(
            "SELECT COALESCE(SUM(p.costo_centavos * vd.cantidad), 0) as costo
             FROM ventas_detalle vd
             JOIN ventas v ON v.id = vd.venta_id
             JOIN productos p ON p.id = vd.producto_id
             WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?"
        );
        $stmt->execute([$desde, $hasta]);
        return (int) $stmt->fetchColumn();
    }

    public function valorInventarioActual(): int
    {
        $stmt = Database::get()->query(
            "SELECT COALESCE(SUM(costo_centavos * stock_actual), 0) FROM productos WHERE estado = 'activo'"
        );
        return (int) $stmt->fetchColumn();
    }

    /** @return array<int, int> IDs de clientes que compraron en el período */
    public function clientesDelPeriodo(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT DISTINCT cliente_id FROM ventas
             WHERE estado = 'completada' AND cliente_id IS NOT NULL AND fecha BETWEEN ? AND ?"
        );
        $stmt->execute([$desde, $hasta]);
        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function primeraCompra(int $clienteId): ?string
    {
        $stmt = Database::get()->prepare(
            "SELECT MIN(fecha) FROM ventas WHERE cliente_id = ? AND estado = 'completada'"
        );
        $stmt->execute([$clienteId]);
        $valor = $stmt->fetchColumn();
        return $valor === false || $valor === null ? null : (string) $valor;
    }

    /** @return array<int, array<string, mixed>> */
    public function ingresosPorCanal(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT canal, COUNT(*) as num_ventas, COALESCE(SUM(total_centavos), 0) as ingresos_centavos
             FROM ventas WHERE estado = 'completada' AND fecha BETWEEN ? AND ?
             GROUP BY canal"
        );
        $stmt->execute([$desde, $hasta]);
        return $stmt->fetchAll();
    }
}
