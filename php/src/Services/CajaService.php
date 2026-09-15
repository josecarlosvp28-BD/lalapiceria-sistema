<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\CajaRepository;
use RuntimeException;

final class CajaException extends RuntimeException
{
}

final class CajaService
{
    public function __construct(private CajaRepository $caja = new CajaRepository())
    {
    }

    public function cajaAbierta(): ?array
    {
        return $this->caja->cajaAbierta();
    }

    public function abrir(int $montoAperturaCentavos, ?int $usuarioId): array
    {
        if ($this->caja->cajaAbierta() !== null) {
            throw new CajaException('Ya existe una caja abierta. Ciérrala antes de abrir una nueva.');
        }
        $id = $this->caja->insertarApertura($montoAperturaCentavos, $usuarioId);
        return $this->caja->obtener($id) ?? [];
    }

    /**
     * Monto esperado en caja: apertura + ventas en efectivo registradas desde que se abrió la caja.
     */
    private function calcularMontoEsperado(array $caja): int
    {
        $ventasEfectivo = $this->caja->ventasEfectivoDesde((string) $caja['created_at']);
        return (int) $caja['monto_apertura_centavos'] + $ventasEfectivo;
    }

    public function montoEsperadoActual(): ?int
    {
        $caja = $this->caja->cajaAbierta();
        if ($caja === null) {
            return null;
        }
        return $this->calcularMontoEsperado($caja);
    }

    public function cerrar(int $montoRealCentavos, ?int $usuarioId, ?string $notas): array
    {
        $caja = $this->caja->cajaAbierta();
        if ($caja === null) {
            throw new CajaException('No hay una caja abierta para cerrar');
        }

        $esperado = $this->calcularMontoEsperado($caja);
        $diferencia = $montoRealCentavos - $esperado;

        $this->caja->cerrar((int) $caja['id'], $usuarioId, $esperado, $montoRealCentavos, $diferencia, $notas);
        return $this->caja->obtener((int) $caja['id']) ?? [];
    }

    public function historial(): array
    {
        return $this->caja->historial();
    }
}
