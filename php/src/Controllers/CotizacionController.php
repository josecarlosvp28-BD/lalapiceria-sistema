<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\CotizacionException;
use App\Services\CotizacionService;
use App\Services\PdfException;
use App\Services\PdfService;

final class CotizacionController
{
    public function __construct(
        private CotizacionService $cotizaciones = new CotizacionService(),
        private PdfService $pdf = new PdfService()
    ) {
    }

    public function listar(): never
    {
        Json::ok($this->cotizaciones->listar());
    }

    public function obtener(string $id): never
    {
        Json::ok($this->cotizaciones->obtener((int) $id));
    }

    public function crear(): never
    {
        $body = Json::body();
        try {
            $cotizacion = $this->cotizaciones->crear(
                (int) ($body['cliente_id'] ?? 0),
                $body['descripcion'] ?? null,
                $body['fecha_entrega_estimada'] ?? null,
                $body['notas'] ?? null,
                $body['items'] ?? []
            );
        } catch (CotizacionException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($cotizacion, 201);
    }

    public function cambiarEstado(string $id): never
    {
        $body = Json::body();
        try {
            $cotizacion = $this->cotizaciones->cambiarEstado((int) $id, (string) ($body['estado'] ?? ''));
        } catch (CotizacionException $e) {
            Json::error($e->getMessage(), 400);
        }
        Json::ok($cotizacion);
    }

    public function pdf(string $id): never
    {
        try {
            $contenido = $this->pdf->generarCotizacionPdf((int) $id);
        } catch (PdfException $e) {
            Json::error($e->getMessage(), 400);
        }

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="cotizacion-' . $id . '.pdf"');
        echo $contenido;
        exit;
    }
}
