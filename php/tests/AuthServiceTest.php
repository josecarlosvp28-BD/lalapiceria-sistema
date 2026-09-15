<?php

declare(strict_types=1);

namespace App\Tests;

use App\Services\AuthException;
use App\Services\AuthService;

final class AuthServiceTest extends DbTestCase
{
    private function insertarUsuario(string $email, string $password, string $rol = 'admin'): void
    {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 4]); // costo bajo, solo para pruebas
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, ?, ?, 1)'
        );
        $stmt->execute(['Usuario de prueba', $email, $rol, $hash]);
    }

    public function testPermiteIniciarSesionConLaContrasenaCorrecta(): void
    {
        $this->insertarUsuario('test@lalapiceria.com', 'correcta123');
        $usuario = (new AuthService())->verificarCredenciales('test@lalapiceria.com', 'correcta123');
        $this->assertSame('test@lalapiceria.com', $usuario['email']);
    }

    public function testRechazaUnaContrasenaIncorrecta(): void
    {
        $this->insertarUsuario('test@lalapiceria.com', 'correcta123');
        $this->expectException(AuthException::class);
        (new AuthService())->verificarCredenciales('test@lalapiceria.com', 'incorrecta');
    }

    public function testRechazaUnCorreoQueNoExiste(): void
    {
        $this->expectException(AuthException::class);
        (new AuthService())->verificarCredenciales('nadie@lalapiceria.com', 'cualquiera');
    }

    public function testRechazaAUnUsuarioDesactivadoAunqueLaContrasenaSeaCorrecta(): void
    {
        $this->insertarUsuario('inactivo@lalapiceria.com', 'correcta123');
        $this->db->prepare('UPDATE usuarios SET activo = 0 WHERE email = ?')->execute(['inactivo@lalapiceria.com']);

        $this->expectException(AuthException::class);
        (new AuthService())->verificarCredenciales('inactivo@lalapiceria.com', 'correcta123');
    }

    public function testNuncaDevuelveElHashDeLaContrasenaEnLaRespuesta(): void
    {
        $this->insertarUsuario('test@lalapiceria.com', 'correcta123');
        $usuario = (new AuthService())->verificarCredenciales('test@lalapiceria.com', 'correcta123');
        $this->assertArrayNotHasKey('pin_hash', $usuario);
    }

    public function testNoPermiteCrearDosUsuariosConElMismoCorreo(): void
    {
        (new AuthService())->crearUsuario('A', 'dup@lalapiceria.com', 'x', 'vendedor');
        $this->expectException(AuthException::class);
        (new AuthService())->crearUsuario('B', 'dup@lalapiceria.com', 'y', 'vendedor');
    }
}
