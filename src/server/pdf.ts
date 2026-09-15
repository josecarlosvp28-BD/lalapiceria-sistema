import PDFDocument from "pdfkit";
import { obtenerCotizacion } from "./repositories/cotizaciones";

function centavosATexto(centavos: number): string {
  return `S/ ${(centavos / 100).toFixed(2)}`;
}

export async function generarCotizacionPDF(cotizacionId: number): Promise<Buffer> {
  const { cotizacion, items } = obtenerCotizacion(cotizacionId) as { cotizacion: any; items: any[] };
  if (!cotizacion) throw new Error("Cotización no encontrada");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fillColor("#4c1d95").fontSize(20).text("La Lapicería", { continued: false });
  doc.fillColor("#666").fontSize(11).text(`Cotización corporativa N.° ${cotizacion.id}`);
  doc.moveDown(1);

  doc.fillColor("#1f0d3c").fontSize(11);
  doc.text(`Cliente: ${cotizacion.cliente_nombre}`);
  doc.text(`Descripción: ${cotizacion.descripcion ?? "—"}`);
  doc.text(`Fecha: ${(cotizacion.fecha_creacion ?? "").slice(0, 10)}`);
  doc.text(`Entrega estimada: ${cotizacion.fecha_entrega_estimada ?? "Por confirmar"}`);
  doc.moveDown(1);

  const colX = { producto: 50, cantidad: 300, precio: 370, subtotal: 460 };
  doc.fontSize(10).fillColor("#4c1d95");
  doc.text("Producto", colX.producto, doc.y, { continued: false });
  doc.text("Cant.", colX.cantidad, doc.y - doc.currentLineHeight());
  doc.text("Precio unit.", colX.precio, doc.y - doc.currentLineHeight());
  doc.text("Subtotal", colX.subtotal, doc.y - doc.currentLineHeight());
  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#4c1d95")
    .stroke();
  doc.moveDown(0.5);

  doc.fillColor("#1f0d3c").fontSize(10);
  for (const item of items) {
    const y = doc.y;
    doc.text(`${item.marca} ${item.modelo}`, colX.producto, y, { width: 240 });
    doc.text(String(item.cantidad), colX.cantidad, y);
    doc.text(centavosATexto(item.precio_unitario_centavos), colX.precio, y);
    doc.text(centavosATexto(item.precio_unitario_centavos * item.cantidad), colX.subtotal, y);
    doc.moveDown(0.7);
  }

  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#4c1d95").stroke();
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#1f0d3c").text(`Total: ${centavosATexto(cotizacion.total_centavos)}`, colX.subtotal - 100, doc.y);

  if (cotizacion.notas) {
    doc.moveDown(1.5);
    doc.fontSize(10).text(`Notas: ${cotizacion.notas}`);
  }

  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#999")
    .text("Cotización válida por 15 días desde la fecha de emisión. Generado por el sistema de gestión de La Lapicería.");

  doc.end();
  return done;
}
