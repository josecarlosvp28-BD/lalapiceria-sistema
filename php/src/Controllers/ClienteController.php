<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\ClienteException;
use App\Services\ClienteService;

final class ClienteController
{
    public function __construct(private ClienteService $clientes = new ClienteService())
    {
    }

    public function listar(): never
    {
        Json::ok($this->clientes->listar($_GET['busqueda'] ?? null));
    }

    public function obtener(string $id): never
    {
        $cliente = $this->clientes->obtener((int) $id);
        if ($cliente === null) {
            Json::error('Cliente no encontrado', 404);
        }
        Json::ok($cliente);
    }

    public function crear(): never
    {
        try {
            $cliente = $this->clientes->crear(Json::body());
        } catch (ClienteException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($cliente, 201);
    }

    public function actualizar(string $id): never
    {
        try {
            $cliente = $this->clientes->actualizar((int) $id, Json::body());
        } catch (ClienteException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($cliente);
    }

    public function historialCompras(string $id): never
    {
        Json::ok($this->clientes->historialCompras((int) $id));
    }

    public function paraSeguimiento(): never
    {
        Json::ok($this->clientes->paraSeguimiento((int) ($_GET['dias'] ?? 90)));
    }

    public function porMarcaComprada(): never
    {
        Json::ok($this->clientes->porMarcaComprada(
            (string) ($_GET['marca'] ?? ''),
            (int) ($_GET['dias'] ?? 180)
        ));
    }

    public function proximosCumpleanos(): never
    {
        Json::ok($this->clientes->proximosCumpleanos((int) ($_GET['dias'] ?? 30)));
    }
}
