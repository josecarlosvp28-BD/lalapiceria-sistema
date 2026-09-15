<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Repositories\CotizacionRepository;
use RuntimeException;

final class CotizacionException extends RuntimeException
{
}

final class CotizacionService
{
    private const SIGUIENTE = [
        'cotizacion' => 'aprobacion',
        'aprobacion' => 'produccion',
        'produccion' => 'entrega',
        'entrega' => null,
    ];

    public function __construct(private CotizacionRepository $cotizaciones = new CotizacionRepository())
    {
    }

    public function listar(): array
    {
        return $this->cotizaciones->listar();
    }

    /** @return array{cotizacion: array<string, mixed>|null, items: array<int, array<string, mixed>>} */
    public function obtener(int $id): array
    {
        return [
            'cotizacion' => $this->cotizaciones->obtenerCabecera($id),
            'items' => $this->cotizaciones->items($id),
        ];
    }

    /** @param array<int, array{producto_id: int, cantidad: int, precio_unitario_centavos: int}> $items */
    public function crear(int $clienteId, ?string $descripcion, ?string $fechaEntregaEstimada, ?string $notas, array $items): array
    {
        if (count($items) === 0) {
            throw new CotizacionException('La cotización debe tener al menos un producto');
        }

        $total = 0;
        foreach ($items as $item) {
            $total += $item['precio_unitario_centavos'] * $item['cantidad'];
        }

        $pdo = Database::get();
        $pdo->beginTransaction();
        try {
            $id = $this->cotizaciones->insertarCabecera($clienteId, $descripcion, $total, $fechaEntregaEstimada, $notas);
            foreach ($items as $item) {
                $this->cotizaciones->insertarItem($id, $item['producto_id'], $item['cantidad'], $item['precio_unitario_centavos']);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return $this->obtener($id);
    }

    public function cambiarEstado(int $id, string $estado): array
    {
        if (!array_key_exists($estado, self::SIGUIENTE)) {
            throw new CotizacionException('Estado inválido');
        }
        $this->cotizaciones->cambiarEstado($id, $estado);
        return $this->obtener($id);
    }
}
