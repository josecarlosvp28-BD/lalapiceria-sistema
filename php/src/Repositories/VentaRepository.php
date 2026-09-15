<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class VentaRepository
{
    /**
     * PDO+mysqlnd devuelve los resultados de SUM()/AVG() como strings (para no
     * perder precisión con tipos DECIMAL anchos), a diferencia del driver de
     * Node que los devolvía como number. Se castean aquí explícitamente para
     * que el JSON de la API entregue números reales, no strings numéricas.
     *
     * @param array<int, array<string, mixed>> $filas
     * @param string[] $camposEnteros
     * @param string[] $camposDecimales
     * @return array<int, array<string, mixed>>
     */
    private function castearNumericos(array $filas, array $camposEnteros = [], array $camposDecimales = []): array
    {
        foreach ($filas as &$fila) {
            foreach ($camposEnteros as $campo) {
                if (isset($fila[$campo])) {
                    $fila[$campo] = (int) $fila[$campo];
                }
            }
            foreach ($camposDecimales as $campo) {
                if (isset($fila[$campo])) {
                    $fila[$campo] = (float) $fila[$campo];
                }
            }
        }
        return $filas;
    }

    public function insertarVenta(
        ?int $clienteId,
        ?int $usuarioId,
        int $subtotalCentavos,
        int $descuentoCentavos,
        ?string $descuentoMotivo,
        int $totalCentavos
    ): int {
        $stmt = Database::get()->prepare(
            "INSERT INTO ventas
                (cliente_id, usuario_id, subtotal_centavos, descuento_centavos, descuento_motivo, total_centavos, estado, canal)
             VALUES (?, ?, ?, ?, ?, ?, 'completada', 'local')"
        );
        $stmt->execute([$clienteId, $usuarioId, $subtotalCentavos, $descuentoCentavos, $descuentoMotivo, $totalCentavos]);
        return (int) Database::get()->lastInsertId();
    }

    public function insertarDetalle(
        int $ventaId,
        int $productoId,
        int $cantidad,
        int $precioUnitarioCentavos,
        int $descuentoCentavos,
        int $subtotalCentavos
    ): void {
        $stmt = Database::get()->prepare(
            'INSERT INTO ventas_detalle
                (venta_id, producto_id, cantidad, precio_unitario_centavos, descuento_centavos, subtotal_centavos)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$ventaId, $productoId, $cantidad, $precioUnitarioCentavos, $descuentoCentavos, $subtotalCentavos]);
    }

    public function insertarPago(int $ventaId, string $metodo, int $montoCentavos): void
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO ventas_pagos (venta_id, metodo, monto_centavos) VALUES (?, ?, ?)'
        );
        $stmt->execute([$ventaId, $metodo, $montoCentavos]);
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM ventas WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @return array<int, array<string, mixed>> */
    public function itemsDeVenta(int $ventaId): array
    {
        $stmt = Database::get()->prepare('SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?');
        $stmt->execute([$ventaId]);
        return $stmt->fetchAll();
    }

    public function marcarAnulada(int $ventaId): void
    {
        $stmt = Database::get()->prepare("UPDATE ventas SET estado = 'anulada', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$ventaId]);
    }

    /** @return array<int, array<string, mixed>> */
    public function listar(?string $desde, ?string $hasta): array
    {
        $clausulas = [];
        $params = [];
        if ($desde) {
            $clausulas[] = 'fecha >= ?';
            $params[] = $desde;
        }
        if ($hasta) {
            $clausulas[] = 'fecha <= ?';
            $params[] = $hasta;
        }
        $where = $clausulas ? 'WHERE ' . implode(' AND ', $clausulas) : '';
        $stmt = Database::get()->prepare("SELECT * FROM ventas {$where} ORDER BY fecha DESC");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** @return array<string, mixed> */
    public function detalle(int $ventaId): array
    {
        $stmtItems = Database::get()->prepare(
            'SELECT vd.*, p.marca, p.modelo, p.sku FROM ventas_detalle vd
             JOIN productos p ON p.id = vd.producto_id
             WHERE vd.venta_id = ?'
        );
        $stmtItems->execute([$ventaId]);

        $stmtPagos = Database::get()->prepare('SELECT * FROM ventas_pagos WHERE venta_id = ?');
        $stmtPagos->execute([$ventaId]);

        return [
            'venta' => $this->obtener($ventaId),
            'items' => $stmtItems->fetchAll(),
            'pagos' => $stmtPagos->fetchAll(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public function reporteMasVendidos(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT p.id, p.marca, p.modelo, SUM(vd.cantidad) as unidades, SUM(vd.subtotal_centavos) as ingresos_centavos
             FROM ventas_detalle vd
             JOIN ventas v ON v.id = vd.venta_id
             JOIN productos p ON p.id = vd.producto_id
             WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
             GROUP BY p.id
             ORDER BY unidades DESC"
        );
        $stmt->execute([$desde, $hasta]);
        return $this->castearNumericos($stmt->fetchAll(), ['id', 'unidades', 'ingresos_centavos']);
    }

    /** @return array<int, array<string, mixed>> */
    public function reportePorPeriodo(string $desde, string $hasta, string $agrupacion): array
    {
        $formato = match ($agrupacion) {
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };
        $stmt = Database::get()->prepare(
            "SELECT DATE_FORMAT(fecha, ?) as periodo, COUNT(*) as num_ventas,
                    SUM(total_centavos) as total_centavos, AVG(total_centavos) as ticket_promedio_centavos
             FROM ventas
             WHERE estado = 'completada' AND fecha BETWEEN ? AND ?
             GROUP BY periodo
             ORDER BY periodo"
        );
        $stmt->execute([$formato, $desde, $hasta]);
        return $this->castearNumericos(
            $stmt->fetchAll(),
            ['num_ventas', 'total_centavos'],
            ['ticket_promedio_centavos']
        );
    }

    /** @return array<int, array<string, mixed>> */
    public function reportePorMarca(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT p.marca, SUM(vd.cantidad) as unidades, SUM(vd.subtotal_centavos) as ingresos_centavos
             FROM ventas_detalle vd
             JOIN ventas v ON v.id = vd.venta_id
             JOIN productos p ON p.id = vd.producto_id
             WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
             GROUP BY p.marca
             ORDER BY ingresos_centavos DESC"
        );
        $stmt->execute([$desde, $hasta]);
        return $this->castearNumericos($stmt->fetchAll(), ['unidades', 'ingresos_centavos']);
    }

    /** @return array<int, array<string, mixed>> */
    public function reportePorCategoria(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT p.categoria, SUM(vd.cantidad) as unidades, SUM(vd.subtotal_centavos) as ingresos_centavos
             FROM ventas_detalle vd
             JOIN ventas v ON v.id = vd.venta_id
             JOIN productos p ON p.id = vd.producto_id
             WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
             GROUP BY p.categoria
             ORDER BY ingresos_centavos DESC"
        );
        $stmt->execute([$desde, $hasta]);
        return $this->castearNumericos($stmt->fetchAll(), ['unidades', 'ingresos_centavos']);
    }

    /** @return array<int, array<string, mixed>> */
    public function reporteMargenPorPeriodo(string $desde, string $hasta, string $agrupacion): array
    {
        $formato = match ($agrupacion) {
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };
        $stmt = Database::get()->prepare(
            "SELECT DATE_FORMAT(v.fecha, ?) as periodo,
                    SUM(vd.subtotal_centavos) as ingresos_centavos,
                    SUM(p.costo_centavos * vd.cantidad) as costo_centavos,
                    SUM(vd.subtotal_centavos) - SUM(p.costo_centavos * vd.cantidad) as margen_centavos
             FROM ventas_detalle vd
             JOIN ventas v ON v.id = vd.venta_id
             JOIN productos p ON p.id = vd.producto_id
             WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
             GROUP BY periodo
             ORDER BY periodo"
        );
        $stmt->execute([$formato, $desde, $hasta]);
        return $this->castearNumericos(
            $stmt->fetchAll(),
            ['ingresos_centavos', 'costo_centavos', 'margen_centavos']
        );
    }

    /** @return array{num_ventas: int, total_centavos: int, ticket_promedio_centavos: float} */
    public function resumenPeriodo(string $desde, string $hasta): array
    {
        $stmt = Database::get()->prepare(
            "SELECT COUNT(*) as num_ventas, COALESCE(SUM(total_centavos), 0) as total_centavos,
                    COALESCE(AVG(total_centavos), 0) as ticket_promedio_centavos
             FROM ventas WHERE estado = 'completada' AND fecha BETWEEN ? AND ?"
        );
        $stmt->execute([$desde, $hasta]);
        $row = $stmt->fetch();
        return [
            'num_ventas' => (int) $row['num_ventas'],
            'total_centavos' => (int) $row['total_centavos'],
            'ticket_promedio_centavos' => (float) $row['ticket_promedio_centavos'],
        ];
    }
}
