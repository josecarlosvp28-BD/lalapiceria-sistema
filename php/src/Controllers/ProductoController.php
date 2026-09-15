<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\ProductoException;
use App\Services\ProductoService;

final class ProductoController
{
    public function __construct(private ProductoService $productos = new ProductoService())
    {
    }

    public function listar(): never
    {
        $filtros = [
            'busqueda' => $_GET['busqueda'] ?? null,
            'marca' => $_GET['marca'] ?? null,
            'categoria' => $_GET['categoria'] ?? null,
            'estado' => $_GET['estado'] ?? null,
        ];
        Json::ok($this->productos->listar(array_filter($filtros, fn ($v) => $v !== null)));
    }

    public function obtener(string $id): never
    {
        $producto = $this->productos->obtener((int) $id);
        if ($producto === null) {
            Json::error('Producto no encontrado', 404);
        }
        Json::ok($producto);
    }

    public function crear(): never
    {
        try {
            $producto = $this->productos->crear(Json::body());
        } catch (ProductoException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($producto, 201);
    }

    public function actualizar(string $id): never
    {
        try {
            $producto = $this->productos->actualizar((int) $id, Json::body());
        } catch (ProductoException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($producto);
    }

    public function stockBajo(): never
    {
        Json::ok($this->productos->stockBajo());
    }
}
