import { getDb } from "../../db";
import type { NuevaVenta, Venta } from "../../shared/types";
import { registrarMovimiento } from "./inventario";

export class VentaError extends Error {}

export function crearVenta(input: NuevaVenta): Venta {
  if (input.items.length === 0) throw new VentaError("La venta debe tener al menos un producto");
  if (input.descuento_centavos > 0 && !input.descuento_motivo) {
    throw new VentaError("Debe indicar el motivo del descuento");
  }

  const subtotal = input.items.reduce(
    (acc, it) => acc + it.precio_unitario_centavos * it.cantidad - it.descuento_centavos,
    0
  );
  const total = subtotal - input.descuento_centavos;

  const totalPagos = input.pagos.reduce((acc, p) => acc + p.monto_centavos, 0);
  if (totalPagos !== total) {
    throw new VentaError(
      `Los pagos (${totalPagos}) no coinciden con el total de la venta (${total})`
    );
  }

  const db = getDb();
  const tx = db.transaction(() => {
    const ventaInfo = db
      .prepare(
        `INSERT INTO ventas
          (cliente_id, usuario_id, subtotal_centavos, descuento_centavos, descuento_motivo, total_centavos, estado, canal)
         VALUES (@cliente_id, @usuario_id, @subtotal_centavos, @descuento_centavos, @descuento_motivo, @total_centavos, 'completada', 'local')`
      )
      .run({
        cliente_id: input.cliente_id,
        usuario_id: input.usuario_id,
        subtotal_centavos: subtotal,
        descuento_centavos: input.descuento_centavos,
        descuento_motivo: input.descuento_motivo,
        total_centavos: total,
      });

    const venta_id = Number(ventaInfo.lastInsertRowid);

    for (const item of input.items) {
      const itemSubtotal = item.precio_unitario_centavos * item.cantidad - item.descuento_centavos;
      db.prepare(
        `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario_centavos, descuento_centavos, subtotal_centavos)
         VALUES (@venta_id, @producto_id, @cantidad, @precio_unitario_centavos, @descuento_centavos, @subtotal_centavos)`
      ).run({ venta_id, ...item, subtotal_centavos: itemSubtotal });

      registrarMovimiento({
        producto_id: item.producto_id,
        tipo: "salida",
        cantidad: item.cantidad,
        motivo: "Venta",
        referencia_tipo: "venta",
        referencia_id: venta_id,
        usuario_id: input.usuario_id,
      });
    }

    for (const pago of input.pagos) {
      db.prepare(
        "INSERT INTO ventas_pagos (venta_id, metodo, monto_centavos) VALUES (@venta_id, @metodo, @monto_centavos)"
      ).run({ venta_id, ...pago });
    }

    return db.prepare("SELECT * FROM ventas WHERE id = ?").get(venta_id) as Venta;
  });

  return tx();
}

export function anularVenta(venta_id: number, usuario_id: number | null, motivo: string): Venta {
  const db = getDb();
  const tx = db.transaction(() => {
    const venta = db.prepare("SELECT * FROM ventas WHERE id = ?").get(venta_id) as Venta | undefined;
    if (!venta) throw new VentaError("Venta no encontrada");
    if (venta.estado === "anulada") throw new VentaError("La venta ya está anulada");

    const items = db
      .prepare("SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?")
      .all(venta_id) as { producto_id: number; cantidad: number }[];

    for (const item of items) {
      registrarMovimiento({
        producto_id: item.producto_id,
        tipo: "entrada",
        cantidad: item.cantidad,
        motivo: `Anulación de venta #${venta_id}: ${motivo}`,
        referencia_tipo: "devolucion",
        referencia_id: venta_id,
        usuario_id,
      });
    }

    db.prepare("UPDATE ventas SET estado = 'anulada', updated_at = datetime('now') WHERE id = ?").run(venta_id);
    return db.prepare("SELECT * FROM ventas WHERE id = ?").get(venta_id) as Venta;
  });

  return tx();
}

export function listarVentas(filtros?: { desde?: string; hasta?: string }): Venta[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filtros?.desde) {
    clauses.push("fecha >= @desde");
    params.desde = filtros.desde;
  }
  if (filtros?.hasta) {
    clauses.push("fecha <= @hasta");
    params.hasta = filtros.hasta;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM ventas ${where} ORDER BY fecha DESC`).all(params) as Venta[];
}

export function detalleVenta(venta_id: number) {
  const db = getDb();
  const venta = db.prepare("SELECT * FROM ventas WHERE id = ?").get(venta_id);
  const items = db
    .prepare(
      `SELECT vd.*, p.marca, p.modelo, p.sku FROM ventas_detalle vd
       JOIN productos p ON p.id = vd.producto_id
       WHERE vd.venta_id = ?`
    )
    .all(venta_id);
  const pagos = db.prepare("SELECT * FROM ventas_pagos WHERE venta_id = ?").all(venta_id);
  return { venta, items, pagos };
}

export function reporteMasVendidos(desde: string, hasta: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.id, p.marca, p.modelo, SUM(vd.cantidad) as unidades, SUM(vd.subtotal_centavos) as ingresos_centavos
       FROM ventas_detalle vd
       JOIN ventas v ON v.id = vd.venta_id
       JOIN productos p ON p.id = vd.producto_id
       WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY unidades DESC`
    )
    .all(desde, hasta);
}

export function reporteVentasPorPeriodo(desde: string, hasta: string, agrupacion: "day" | "month" | "year") {
  const db = getDb();
  const formato = agrupacion === "day" ? "%Y-%m-%d" : agrupacion === "month" ? "%Y-%m" : "%Y";
  return db
    .prepare(
      `SELECT strftime('${formato}', fecha) as periodo, COUNT(*) as num_ventas,
              SUM(total_centavos) as total_centavos, AVG(total_centavos) as ticket_promedio_centavos
       FROM ventas
       WHERE estado = 'completada' AND fecha BETWEEN ? AND ?
       GROUP BY periodo
       ORDER BY periodo`
    )
    .all(desde, hasta);
}
