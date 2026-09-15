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

        // Algunos entornos (incluyendo PHP local de Homebrew, y posiblemente
        // configuraciones de hosting compartido) no traen session.save_path
        // configurado, lo que rompe session_start() silenciosamente. Se fija
        // una ruta explícita y escribible como red de seguridad.
        if (session_save_path() === '' || session_save_path() === false) {
            $rutaSesiones = ($_ENV['SESSION_SAVE_PATH'] ?? null) ?: sys_get_temp_dir();
            if (!is_dir($rutaSesiones)) {
                mkdir($rutaSesiones, 0700, true);
            }
            session_save_path($rutaSesiones);
        }

        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30, // 30 días
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => ($_ENV['APP_ENV'] ?? 'production') === 'production',
        ]);
        session_name('lalapiceria_sid');

        // Si el navegador trae una cookie de sesión con un formato inválido
        // (de una configuración anterior rota, por ejemplo), session_start()
        // emite un warning y lo deja como HTML en medio de la respuesta JSON,
        // rompiendo el frontend. Se descarta esa cookie ANTES de arrancar la
        // sesión, para que PHP simplemente genere una nueva.
        $cookieActual = $_COOKIE['lalapiceria_sid'] ?? null;
        if ($cookieActual !== null && !preg_match('/^[A-Za-z0-9,-]{22,250}$/', $cookieActual)) {
            unset($_COOKIE['lalapiceria_sid']);
        }

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
