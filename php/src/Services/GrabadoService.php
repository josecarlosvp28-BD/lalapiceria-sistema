<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\GrabadoRepository;
use RuntimeException;

final class GrabadoException extends RuntimeException
{
}

final class GrabadoService
{
    private const SIGUIENTE = [
        'recibido' => 'en_proceso',
        'en_proceso' => 'control_calidad',
        'control_calidad' => 'listo',
        'listo' => 'entregado',
        'entregado' => null,
    ];

    public function __construct(private GrabadoRepository $grabados = new GrabadoRepository())
    {
    }

    public function listar(?string $estado): array
    {
        return $this->grabados->listar($estado);
    }

    public function obtener(int $id): ?array
    {
        return $this->grabados->obtener($id);
    }

    public function crear(array $input): array
    {
        foreach (['cliente_id', 'producto_id', 'texto_grabado'] as $campo) {
            if (empty($input[$campo])) {
                throw new GrabadoException("El campo '{$campo}' es obligatorio");
            }
        }
        $id = $this->grabados->crear($input);
        return $this->grabados->obtener($id) ?? [];
    }

    public function cambiarEstado(int $id, string $estado): array
    {
        $orden = $this->grabados->obtener($id);
        if ($orden === null) {
            throw new GrabadoException('Orden de grabado no encontrada');
        }
        if (!array_key_exists($estado, self::SIGUIENTE)) {
            throw new GrabadoException('Estado inválido');
        }
        $this->grabados->cambiarEstado($id, $estado);
        return $this->grabados->obtener($id) ?? [];
    }

    public function siguienteEstado(string $estado): ?string
    {
        return self::SIGUIENTE[$estado] ?? null;
    }

    public function listasParaEntrega(): array
    {
        return $this->grabados->listasParaEntrega();
    }

    public function historialCliente(int $clienteId): array
    {
        return $this->grabados->historialCliente($clienteId);
    }
}
