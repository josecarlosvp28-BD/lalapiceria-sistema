<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\InventarioException;
use App\Services\InventarioService;

final class InventarioController
{
    public function __construct(private InventarioService $inventario = new InventarioService())
    {
    }

    public function registrarMovimiento(): never
    {
        $body = Json::body();
        try {
            $movimiento = $this->inventario->registrarMovimiento(
                (int) ($body['producto_id'] ?? 0),
                (string) ($body['tipo'] ?? ''),
                (int) ($body['cantidad'] ?? 0),
                $body['motivo'] ?? null,
                $body['referencia_tipo'] ?? null,
                isset($body['referencia_id']) ? (int) $body['referencia_id'] : null,
                isset($body['usuario_id']) ? (int) $body['usuario_id'] : null
            );
        } catch (InventarioException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($movimiento);
    }

    public function historial(string $productoId): never
    {
        Json::ok($this->inventario->historial((int) $productoId));
    }
}
