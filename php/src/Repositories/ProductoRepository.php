<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;

final class ProductoRepository
{
    /**
     * @param array{busqueda?: string, marca?: string, categoria?: string, estado?: string} $filtros
     * @return array<int, array<string, mixed>>
     */
    public function listar(array $filtros = []): array
    {
        $clausulas = [];
        $params = [];

        if (!empty($filtros['busqueda'])) {
            $clausulas[] = '(sku LIKE ? OR marca LIKE ? OR modelo LIKE ?)';
            $like = '%' . $filtros['busqueda'] . '%';
            array_push($params, $like, $like, $like);
        }
        if (!empty($filtros['marca'])) {
            $clausulas[] = 'marca = ?';
            $params[] = $filtros['marca'];
        }
        if (!empty($filtros['categoria'])) {
            $clausulas[] = 'categoria = ?';
            $params[] = $filtros['categoria'];
        }
        if (!empty($filtros['estado'])) {
            $clausulas[] = 'estado = ?';
            $params[] = $filtros['estado'];
        }

        $where = $clausulas ? 'WHERE ' . implode(' AND ', $clausulas) : '';
        $stmt = Database::get()->prepare("SELECT * FROM productos {$where} ORDER BY marca, modelo");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function obtener(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function obtenerPorSku(string $sku): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM productos WHERE sku = ?');
        $stmt->execute([$sku]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @param array<string, mixed> $p */
    public function crear(array $p): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO productos
                (sku, marca, modelo, categoria, variante_color, variante_acabado, variante_punta,
                 costo_centavos, precio_centavos, proveedor_id, stock_minimo, ubicacion, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $p['sku'], $p['marca'], $p['modelo'], $p['categoria'],
            $p['variante_color'] ?? null, $p['variante_acabado'] ?? null, $p['variante_punta'] ?? null,
            $p['costo_centavos'] ?? 0, $p['precio_centavos'] ?? 0, $p['proveedor_id'] ?? null,
            $p['stock_minimo'] ?? 0, $p['ubicacion'] ?? null, $p['estado'] ?? 'activo',
        ]);
        return (int) Database::get()->lastInsertId();
    }

    /** @param array<string, mixed> $p */
    public function actualizar(int $id, array $p): void
    {
        $stmt = Database::get()->prepare(
            'UPDATE productos SET
                sku = ?, marca = ?, modelo = ?, categoria = ?,
                variante_color = ?, variante_acabado = ?, variante_punta = ?,
                costo_centavos = ?, precio_centavos = ?, proveedor_id = ?,
                stock_minimo = ?, ubicacion = ?, estado = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            $p['sku'], $p['marca'], $p['modelo'], $p['categoria'],
            $p['variante_color'] ?? null, $p['variante_acabado'] ?? null, $p['variante_punta'] ?? null,
            $p['costo_centavos'], $p['precio_centavos'], $p['proveedor_id'] ?? null,
            $p['stock_minimo'], $p['ubicacion'] ?? null, $p['estado'],
            $id,
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    public function stockBajo(): array
    {
        $stmt = Database::get()->query(
            "SELECT * FROM productos WHERE stock_actual <= stock_minimo AND estado = 'activo' ORDER BY marca"
        );
        return $stmt->fetchAll();
    }
}
