<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\GarantiaRepository;
use RuntimeException;

final class GarantiaException extends RuntimeException
{
}

final class GarantiaService
{
    private const ESTADOS_VALIDOS = ['en_revision', 'en_reparacion', 'listo', 'entregado', 'no_procede'];

    public function __construct(private GarantiaRepository $garantias = new GarantiaRepository())
    {
    }

    public function listar(?string $estado): array
    {
        return $this->garantias->listar($estado);
    }

    public function crear(array $input): array
    {
        if (empty($input['cliente_id']) || empty($input['falla'])) {
            throw new GarantiaException('Cliente y descripción de la falla son obligatorios');
        }
        $id = $this->garantias->crear($input);
        return $this->garantias->obtener($id) ?? [];
    }

    public function cambiarEstado(int $id, string $estado): array
    {
        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new GarantiaException('Estado inválido');
        }
        $this->garantias->cambiarEstado($id, $estado);
        return $this->garantias->obtener($id) ?? [];
    }
}
