<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\DashboardRepository;

final class DashboardService
{
    public function __construct(private DashboardRepository $dashboard = new DashboardRepository())
    {
    }

    public function resumenGeneral(string $desde, string $hasta): array
    {
        return $this->dashboard->resumenGeneral($desde, $hasta);
    }

    /**
     * Rotación de inventario aproximada: costo de lo vendido en el período dividido entre
     * el valor de costo del inventario actual (aproximación del inventario promedio,
     * ver misma nota en la versión Node — MIGRATION_AUDIT.md).
     */
    public function rotacionInventario(string $desde, string $hasta): array
    {
        $costoVendido = $this->dashboard->costoVendido($desde, $hasta);
        $valorInventario = $this->dashboard->valorInventarioActual();
        $rotacion = $valorInventario === 0 ? 0.0 : round(($costoVendido / $valorInventario) * 100) / 100;

        return [
            'costo_vendido_centavos' => $costoVendido,
            'valor_inventario_actual_centavos' => $valorInventario,
            'rotacion' => $rotacion,
        ];
    }

    public function clientesNuevosVsRecurrentes(string $desde, string $hasta): array
    {
        $clientes = $this->dashboard->clientesDelPeriodo($desde, $hasta);
        $nuevos = 0;
        $recurrentes = 0;

        foreach ($clientes as $clienteId) {
            $primera = $this->dashboard->primeraCompra($clienteId);
            if ($primera !== null && $primera >= $desde) {
                $nuevos++;
            } else {
                $recurrentes++;
            }
        }

        $total = $nuevos + $recurrentes;
        return [
            'nuevos' => $nuevos,
            'recurrentes' => $recurrentes,
            'total' => $total,
            'pct_nuevos' => $total === 0 ? 0.0 : round(($nuevos / $total) * 1000) / 10,
            'pct_recurrentes' => $total === 0 ? 0.0 : round(($recurrentes / $total) * 1000) / 10,
        ];
    }

    public function ingresosPorCanal(string $desde, string $hasta): array
    {
        return $this->dashboard->ingresosPorCanal($desde, $hasta);
    }
}
