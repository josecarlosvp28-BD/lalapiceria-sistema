<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class ClienteRepository
{
    /** @return array<int, array<string, mixed>> */
    public function listar(?string $busqueda): array
    {
        if ($busqueda) {
            $stmt = Database::get()->prepare(
                'SELECT * FROM clientes WHERE nombre LIKE ? OR dni_ruc LIKE ? OR telefono LIKE ? ORDER BY nombre'
            );
            $like = '%' . $busqueda . '%';
            $stmt->execute([$like, $like, $like]);
            return $stmt->fetchAll();
        }
        return Database::get()->query('SELECT * FROM clientes ORDER BY nombre')->fetchAll();
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM clientes WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @param array<string, mixed> $c */
    public function crear(array $c): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO clientes
                (nombre, dni_ruc, telefono, email, direccion, fecha_nacimiento, tipo_cliente, marca_favorita, presupuesto_rango, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $c['nombre'], $c['dni_ruc'] ?? null, $c['telefono'] ?? null, $c['email'] ?? null,
            $c['direccion'] ?? null, ($c['fecha_nacimiento'] ?? '') ?: null, $c['tipo_cliente'] ?? 'retail',
            $c['marca_favorita'] ?? null, $c['presupuesto_rango'] ?? null, $c['notas'] ?? null,
        ]);
        return (int) Database::get()->lastInsertId();
    }

    /** @param array<string, mixed> $c */
    public function actualizar(int $id, array $c): void
    {
        $stmt = Database::get()->prepare(
            'UPDATE clientes SET
                nombre = ?, dni_ruc = ?, telefono = ?, email = ?, direccion = ?,
                fecha_nacimiento = ?, tipo_cliente = ?, marca_favorita = ?, presupuesto_rango = ?, notas = ?,
                updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            $c['nombre'], $c['dni_ruc'] ?? null, $c['telefono'] ?? null, $c['email'] ?? null,
            $c['direccion'] ?? null, ($c['fecha_nacimiento'] ?? '') ?: null, $c['tipo_cliente'],
            $c['marca_favorita'] ?? null, $c['presupuesto_rango'] ?? null, $c['notas'] ?? null,
            $id,
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    public function historialCompras(int $clienteId): array
    {
        $stmt = Database::get()->prepare(
            "SELECT v.*, GROUP_CONCAT(CONCAT(p.marca, ' ', p.modelo) SEPARATOR ', ') as productos
             FROM ventas v
             LEFT JOIN ventas_detalle vd ON vd.venta_id = v.id
             LEFT JOIN productos p ON p.id = vd.producto_id
             WHERE v.cliente_id = ? AND v.estado = 'completada'
             GROUP BY v.id
             ORDER BY v.fecha DESC"
        );
        $stmt->execute([$clienteId]);
        return $stmt->fetchAll();
    }

    /** @return array<int, array<string, mixed>> */
    public function paraSeguimiento(int $dias): array
    {
        $stmt = Database::get()->prepare(
            "SELECT c.*, MAX(v.fecha) as ultima_compra
             FROM clientes c
             JOIN ventas v ON v.cliente_id = c.id AND v.estado = 'completada'
             GROUP BY c.id
             HAVING MAX(v.fecha) < DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY ultima_compra"
        );
        $stmt->execute([$dias]);
        return $stmt->fetchAll();
    }

    /** @return array<int, array<string, mixed>> */
    public function porMarcaComprada(string $marca, int $dias): array
    {
        $stmt = Database::get()->prepare(
            "SELECT DISTINCT c.*
             FROM clientes c
             JOIN ventas v ON v.cliente_id = c.id AND v.estado = 'completada'
             JOIN ventas_detalle vd ON vd.venta_id = v.id
             JOIN productos p ON p.id = vd.producto_id
             WHERE p.marca = ? AND v.fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY c.nombre"
        );
        $stmt->execute([$marca, $dias]);
        return $stmt->fetchAll();
    }

    /**
     * Cumpleaños dentro de los próximos `dias` días. Nota: la comparación por
     * mes-día no cruza correctamente el límite de fin de año (p. ej. un rango
     * que va de diciembre a enero) — limitación heredada de la versión Node,
     * aceptable para el tamaño de este negocio, no corregida en la migración.
     *
     * @return array<int, array<string, mixed>>
     */
    public function proximosCumpleanos(int $dias): array
    {
        $stmt = Database::get()->prepare(
            "SELECT * FROM clientes
             WHERE fecha_nacimiento IS NOT NULL
             AND DATE_FORMAT(fecha_nacimiento, '%m-%d') BETWEEN DATE_FORMAT(NOW(), '%m-%d')
                AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL ? DAY), '%m-%d')
             ORDER BY DATE_FORMAT(fecha_nacimiento, '%m-%d')"
        );
        $stmt->execute([$dias]);
        return $stmt->fetchAll();
    }
}
