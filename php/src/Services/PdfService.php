<?php

declare(strict_types=1);

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use RuntimeException;

final class PdfException extends RuntimeException
{
}

final class PdfService
{
    public function __construct(private CotizacionService $cotizaciones = new CotizacionService())
    {
    }

    public function generarCotizacionPdf(int $cotizacionId): string
    {
        $data = $this->cotizaciones->obtener($cotizacionId);
        $cotizacion = $data['cotizacion'];
        $items = $data['items'];

        if ($cotizacion === null) {
            throw new PdfException('Cotización no encontrada');
        }

        $html = $this->construirHtml($cotizacion, $items);

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }

    private function centavosATexto(int $centavos): string
    {
        return 'S/ ' . number_format($centavos / 100, 2);
    }

    private function e(?string $texto): string
    {
        return htmlspecialchars($texto ?? '', ENT_QUOTES, 'UTF-8');
    }

    /** @param array<int, array<string, mixed>> $items */
    private function construirHtml(array $cotizacion, array $items): string
    {
        $filas = '';
        foreach ($items as $item) {
            $subtotal = $item['precio_unitario_centavos'] * $item['cantidad'];
            $filas .= '<tr>
                <td>' . $this->e($item['marca']) . ' ' . $this->e($item['modelo']) . '</td>
                <td class="right">' . (int) $item['cantidad'] . '</td>
                <td class="right">' . $this->centavosATexto((int) $item['precio_unitario_centavos']) . '</td>
                <td class="right">' . $this->centavosATexto($subtotal) . '</td>
            </tr>';
        }

        $notas = $cotizacion['notas']
            ? '<p style="margin-top:20px; font-size:13px;"><strong>Notas:</strong> ' . $this->e($cotizacion['notas']) . '</p>'
            : '';

        $fecha = $this->e(substr((string) $cotizacion['fecha_creacion'], 0, 10));
        $entrega = $this->e($cotizacion['fecha_entrega_estimada'] ?? 'Por confirmar');
        $descripcion = $this->e($cotizacion['descripcion']) ?: '—';
        $clienteNombre = $this->e($cotizacion['cliente_nombre']);
        $totalTexto = $this->centavosATexto((int) $cotizacion['total_centavos']);

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Helvetica, Arial, sans-serif; color: #1f0d3c; }
            h1 { font-size: 22px; margin-bottom: 0; color: #4c1d95; }
            .subtitle { color: #666; margin-top: 4px; margin-bottom: 24px; font-size: 13px; }
            .meta { width: 100%; margin-bottom: 24px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; border-bottom: 2px solid #4c1d95; padding: 8px 4px; color: #4c1d95; }
            td { padding: 8px 4px; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .total-row td { border-top: 2px solid #4c1d95; border-bottom: none; font-weight: bold; font-size: 15px; }
            .footer { margin-top: 40px; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <h1>La Lapicería</h1>
          <div class="subtitle">Cotización corporativa N.° {$cotizacion['id']}</div>

          <table class="meta">
            <tr>
              <td><strong>Cliente:</strong> {$clienteNombre}<br/>
                  <strong>Descripción:</strong> {$descripcion}</td>
              <td><strong>Fecha:</strong> {$fecha}<br/>
                  <strong>Entrega estimada:</strong> {$entrega}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr><th>Producto</th><th class="right">Cantidad</th><th class="right">Precio unit.</th><th class="right">Subtotal</th></tr>
            </thead>
            <tbody>
              {$filas}
              <tr class="total-row">
                <td colspan="3" class="right">Total</td>
                <td class="right">{$totalTexto}</td>
              </tr>
            </tbody>
          </table>

          {$notas}

          <div class="footer">Cotización válida por 15 días desde la fecha de emisión. Generado por el sistema de gestión de La Lapicería.</div>
        </body>
        </html>
        HTML;
    }
}
