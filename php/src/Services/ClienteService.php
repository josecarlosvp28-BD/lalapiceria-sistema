<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ClienteRepository;
use RuntimeException;

final class ClienteException extends RuntimeException
{
}

final class ClienteService
{
    public function __construct(private ClienteRepository $clientes = new ClienteRepository())
    {
    }

    public function listar(?string $busqueda): array
    {
        return $this->clientes->listar($busqueda);
    }

    public function obtener(int $id): ?array
    {
        return $this->clientes->obtener($id);
    }

    public function crear(array $datos): array
    {
        if (empty($datos['nombre'])) {
            throw new ClienteException('El nombre es obligatorio');
        }
        $id = $this->clientes->crear($datos);
        return $this->clientes->obtener($id) ?? [];
    }

    public function actualizar(int $id, array $datos): array
    {
        $actual = $this->clientes->obtener($id);
        if ($actual === null) {
            throw new ClienteException('Cliente no encontrado');
        }
        $fusionado = array_merge($actual, $datos);
        if (empty($fusionado['nombre'])) {
            throw new ClienteException('El nombre es obligatorio');
        }
        $this->clientes->actualizar($id, $fusionado);
        return $this->clientes->obtener($id) ?? [];
    }

    public function historialCompras(int $id): array
    {
        return $this->clientes->historialCompras($id);
    }

    public function paraSeguimiento(int $dias): array
    {
        return $this->clientes->paraSeguimiento($dias);
    }

    public function porMarcaComprada(string $marca, int $dias): array
    {
        return $this->clientes->porMarcaComprada($marca, $dias);
    }

    public function proximosCumpleanos(int $dias): array
    {
        return $this->clientes->proximosCumpleanos($dias);
    }
}
