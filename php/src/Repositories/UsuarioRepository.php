<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class UsuarioRepository
{
    public function findByEmail(string $email): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function findById(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function count(): int
    {
        return (int) Database::get()->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
    }

    public function insert(string $nombre, ?string $email, string $rol, string $pinHash): int
    {
        $stmt = Database::get()->prepare(
            'INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, ?, ?, 1)'
        );
        $stmt->execute([$nombre, $email, $rol, $pinHash]);
        return (int) Database::get()->lastInsertId();
    }

    /** @return array<int, array<string, mixed>> */
    public function listAll(): array
    {
        $stmt = Database::get()->query(
            'SELECT id, nombre, email, rol, activo, created_at, updated_at FROM usuarios ORDER BY nombre'
        );
        return $stmt->fetchAll();
    }

    public function setActivo(int $id, bool $activo): void
    {
        $stmt = Database::get()->prepare('UPDATE usuarios SET activo = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$activo ? 1 : 0, $id]);
    }

    public function emailExists(string $email): bool
    {
        $stmt = Database::get()->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    }
}
