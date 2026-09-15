<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\CajaException;
use App\Services\CajaService;

final class CajaController
{
    public function __construct(private CajaService $caja = new CajaService())
    {
    }

    public function actual(): never
    {
        Json::ok($this->caja->cajaAbierta());
    }

    public function montoEsperado(): never
    {
        Json::ok($this->caja->montoEsperadoActual());
    }

    public function abrir(): never
    {
        $body = Json::body();
        try {
            $caja = $this->caja->abrir(
                (int) ($body['monto_apertura_centavos'] ?? 0),
                isset($body['usuario_id']) ? (int) $body['usuario_id'] : null
            );
        } catch (CajaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($caja, 201);
    }

    public function cerrar(): never
    {
        $body = Json::body();
        try {
            $caja = $this->caja->cerrar(
                (int) ($body['monto_cierre_real_centavos'] ?? 0),
                isset($body['usuario_id']) ? (int) $body['usuario_id'] : null,
                $body['notas'] ?? null
            );
        } catch (CajaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($caja);
    }

    public function historial(): never
    {
        Json::ok($this->caja->historial());
    }
}
