<?php

declare(strict_types=1);

namespace App\Http;

final class SessionAuth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30, // 30 días
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => ($_ENV['APP_ENV'] ?? 'production') === 'production',
        ]);
        session_name('lalapiceria_sid');
        session_start();
    }

    public static function userId(): ?int
    {
        return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
    }

    public static function login(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    public static function requireAuth(): int
    {
        $id = self::userId();
        if ($id === null) {
            Json::error('Sesión no iniciada', 401);
        }
        return $id;
    }
}
