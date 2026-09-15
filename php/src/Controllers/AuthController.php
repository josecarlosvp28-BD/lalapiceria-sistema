<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Http\SessionAuth;
use App\Services\AuthException;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(private AuthService $auth = new AuthService())
    {
    }

    public function login(): never
    {
        $body = Json::body();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            Json::error('Correo y contraseña son obligatorios', 400);
        }

        try {
            $usuario = $this->auth->verificarCredenciales($email, $password);
        } catch (AuthException $e) {
            Json::error($e->getMessage(), 401);
        }

        SessionAuth::login((int) $usuario['id']);
        Json::ok($usuario);
    }

    public function logout(): never
    {
        SessionAuth::logout();
        Json::ok(null);
    }

    public function me(): never
    {
        $userId = SessionAuth::userId();
        if ($userId === null) {
            Json::ok(null);
        }
        Json::ok($this->auth->obtenerUsuario($userId));
    }

    public function listar(): never
    {
        Json::ok($this->auth->listarUsuarios());
    }

    public function crear(): never
    {
        $body = Json::body();
        $nombre = trim((string) ($body['nombre'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $rol = (string) ($body['rol'] ?? '');

        if ($nombre === '' || $email === '' || $password === '' || !in_array($rol, ['admin', 'vendedor', 'taller_grabado'], true)) {
            Json::error('Nombre, correo, contraseña y rol válido son obligatorios', 400);
        }

        try {
            $usuario = $this->auth->crearUsuario($nombre, $email, $password, $rol);
        } catch (AuthException $e) {
            Json::error($e->getMessage(), 400);
        }

        Json::ok($usuario, 201);
    }

    public function cambiarEstado(string $id): never
    {
        $body = Json::body();
        $activo = (bool) ($body['activo'] ?? true);
        Json::ok($this->auth->cambiarEstado((int) $id, $activo));
    }
}
