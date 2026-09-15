<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\VentaException;
use App\Services\VentaService;

final class VentaController
{
    public function __construct(private VentaService $ventas = new VentaService())
    {
    }

    public function crear(): never
    {
        $body = Json::body();
        try {
            $venta = $this->ventas->crear(
                isset($body['cliente_id']) ? (int) $body['cliente_id'] : null,
                isset($body['usuario_id']) ? (int) $body['usuario_id'] : null,
                $body['items'] ?? [],
                (int) ($body['descuento_centavos'] ?? 0),
                $body['descuento_motivo'] ?? null,
                $body['pagos'] ?? []
            );
        } catch (VentaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($venta, 201);
    }

    public function anular(string $id): never
    {
        $body = Json::body();
        try {
            $venta = $this->ventas->anular(
                (int) $id,
                isset($body['usuario_id']) ? (int) $body['usuario_id'] : null,
                (string) ($body['motivo'] ?? '')
            );
        } catch (VentaException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($venta);
    }

    public function listar(): never
    {
        Json::ok($this->ventas->listar($_GET['desde'] ?? null, $_GET['hasta'] ?? null));
    }

    public function detalle(string $id): never
    {
        Json::ok($this->ventas->detalle((int) $id));
    }

    public function reporteMasVendidos(): never
    {
        Json::ok($this->ventas->reporteMasVendidos((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function reportePorPeriodo(): never
    {
        Json::ok($this->ventas->reportePorPeriodo(
            (string) $_GET['desde'],
            (string) $_GET['hasta'],
            (string) ($_GET['agrupacion'] ?? 'day')
        ));
    }

    public function reportePorMarca(): never
    {
        Json::ok($this->ventas->reportePorMarca((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function reportePorCategoria(): never
    {
        Json::ok($this->ventas->reportePorCategoria((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function reporteMargen(): never
    {
        Json::ok($this->ventas->reporteMargen(
            (string) $_GET['desde'],
            (string) $_GET['hasta'],
            (string) ($_GET['agrupacion'] ?? 'day')
        ));
    }

    public function resumenComparativo(): never
    {
        Json::ok($this->ventas->resumenComparativo(
            (string) $_GET['desde'],
            (string) $_GET['hasta'],
            (string) $_GET['desdeAnterior'],
            (string) $_GET['hastaAnterior']
        ));
    }
}
