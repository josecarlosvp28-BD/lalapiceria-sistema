import { BrowserWindow, dialog, shell } from "electron";
import fs from "node:fs";
import { obtenerCotizacion } from "./repositories/cotizaciones";

function centavosATexto(centavos: number): string {
  return `S/ ${(centavos / 100).toFixed(2)}`;
}

function escapeHtml(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function construirHtml(cotizacion: any, items: any[]): string {
  const filas = items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.marca)} ${escapeHtml(it.modelo)}</td>
        <td class="right">${it.cantidad}</td>
        <td class="right">${centavosATexto(it.precio_unitario_centavos)}</td>
        <td class="right">${centavosATexto(it.precio_unitario_centavos * it.cantidad)}</td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1f0d3c; padding: 40px; }
      h1 { font-size: 22px; margin-bottom: 0; color: #4c1d95; }
      .subtitle { color: #666; margin-top: 4px; margin-bottom: 24px; font-size: 13px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
      .meta div { line-height: 1.6; }
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
    <div class="subtitle">Cotización corporativa N.° ${cotizacion.id}</div>

    <div class="meta">
      <div>
        <strong>Cliente:</strong> ${escapeHtml(cotizacion.cliente_nombre)}<br/>
        <strong>Descripción:</strong> ${escapeHtml(cotizacion.descripcion) || "—"}
      </div>
      <div>
        <strong>Fecha:</strong> ${escapeHtml(cotizacion.fecha_creacion?.slice(0, 10))}<br/>
        <strong>Entrega estimada:</strong> ${escapeHtml(cotizacion.fecha_entrega_estimada) || "Por confirmar"}
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Producto</th><th class="right">Cantidad</th><th class="right">Precio unit.</th><th class="right">Subtotal</th></tr>
      </thead>
      <tbody>
        ${filas}
        <tr class="total-row">
          <td colspan="3" class="right">Total</td>
          <td class="right">${centavosATexto(cotizacion.total_centavos)}</td>
        </tr>
      </tbody>
    </table>

    ${cotizacion.notas ? `<p style="margin-top:20px; font-size:13px;"><strong>Notas:</strong> ${escapeHtml(cotizacion.notas)}</p>` : ""}

    <div class="footer">Cotización válida por 15 días desde la fecha de emisión. Generado por el sistema de gestión de La Lapicería.</div>
  </body>
  </html>`;
}

export async function generarCotizacionPDF(cotizacionId: number): Promise<string | null> {
  const { cotizacion, items } = obtenerCotizacion(cotizacionId);
  if (!cotizacion) throw new Error("Cotización no encontrada");

  const html = construirHtml(cotizacion, items);

  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
  win.close();

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Guardar cotización como PDF",
    defaultPath: `Cotizacion-${(cotizacion as any).id}-${(cotizacion as any).cliente_nombre}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return null;

  fs.writeFileSync(filePath, pdfBuffer);
  shell.showItemInFolder(filePath);
  return filePath;
}
