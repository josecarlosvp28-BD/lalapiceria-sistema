<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\UsuarioRepository;
use RuntimeException;

final class AuthException extends RuntimeException
{
}

final class AuthService
{
    public function __construct(private UsuarioRepository $usuarios = new UsuarioRepository())
    {
    }

    /** @return array<string, mixed> */
    public function verificarCredenciales(string $email, string $password): array
    {
        $usuario = $this->usuarios->findByEmail($email);
        if ($usuario === null || !password_verify($password, $usuario['pin_hash'])) {
            throw new AuthException('Correo o contraseña incorrectos');
        }

        unset($usuario['pin_hash']);
        return $usuario;
    }

    /** @return array<string, mixed>|null */
    public function obtenerUsuario(int $id): ?array
    {
        $usuario = $this->usuarios->findById($id);
        if ($usuario === null) {
            return null;
        }
        unset($usuario['pin_hash']);
        return $usuario;
    }

    /** @return array<int, array<string, mixed>> */
    public function listarUsuarios(): array
    {
        return $this->usuarios->listAll();
    }

    /** @return array<string, mixed> */
    public function crearUsuario(string $nombre, string $email, string $password, string $rol): array
    {
        if ($this->usuarios->emailExists($email)) {
            throw new AuthException('Ya existe un usuario con ese correo');
        }
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $id = $this->usuarios->insert($nombre, $email, $rol, $hash);
        return $this->obtenerUsuario($id) ?? [];
    }

    public function cambiarEstado(int $id, bool $activo): ?array
    {
        $this->usuarios->setActivo($id, $activo);
        return $this->obtenerUsuario($id);
    }

    /**
     * Crea el usuario administrador inicial si la tabla está vacía.
     * Devuelve las credenciales generadas, o null si ya existía al menos un usuario.
     */
    public function sembrarAdminSiVacio(): ?array
    {
        if ($this->usuarios->count() > 0) {
            return null;
        }

        $email = 'admin@lalapiceria.com';
        $password = bin2hex(random_bytes(6)); // contraseña temporal aleatoria, se imprime una sola vez
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $this->usuarios->insert('Administrador', $email, 'admin', $hash);

        return ['email' => $email, 'password' => $password];
    }
}
