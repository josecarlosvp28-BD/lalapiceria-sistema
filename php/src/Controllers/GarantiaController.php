<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\GarantiaException;
use App\Services\GarantiaService;

final class GarantiaController
{
    public function __construct(private GarantiaService $garantias = new GarantiaService())
    {
    }

    public function listar(): never
    {
        Json::ok($this->garantias->listar($_GET['estado'] ?? null));
    }

    public function crear(): never
    {
        try {
            $garantia = $this->garantias->crear(Json::body());
        } catch (GarantiaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($garantia, 201);
    }

    public function cambiarEstado(string $id): never
    {
        $body = Json::body();
        try {
            $garantia = $this->garantias->cambiarEstado((int) $id, (string) ($body['estado'] ?? ''));
        } catch (GarantiaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($garantia);
    }
}
