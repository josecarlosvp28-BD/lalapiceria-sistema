<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\GrabadoException;
use App\Services\GrabadoService;

final class GrabadoController
{
    public function __construct(private GrabadoService $grabados = new GrabadoService())
    {
    }

    public function listar(): never
    {
        Json::ok($this->grabados->listar($_GET['estado'] ?? null));
    }

    public function obtener(string $id): never
    {
        $orden = $this->grabados->obtener((int) $id);
        if ($orden === null) {
            Json::error('Orden no encontrada', 404);
        }
        Json::ok($orden);
    }

    public function crear(): never
    {
        try {
            $orden = $this->grabados->crear(Json::body());
        } catch (GrabadoException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($orden, 201);
    }

    public function cambiarEstado(string $id): never
    {
        $body = Json::body();
        try {
            $orden = $this->grabados->cambiarEstado((int) $id, (string) ($body['estado'] ?? ''));
        } catch (GrabadoException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($orden);
    }

    public function listasParaEntrega(): never
    {
        Json::ok($this->grabados->listasParaEntrega());
    }

    public function historialCliente(string $id): never
    {
        Json::ok($this->grabados->historialCliente((int) $id));
    }
}
