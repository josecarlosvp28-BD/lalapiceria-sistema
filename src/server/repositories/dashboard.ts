import { getDb } from "../../db";

export function kpiResumenGeneral(desde: string, hasta: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT COUNT(*) as num_ventas, COALESCE(SUM(total_centavos), 0) as ingresos_centavos,
              COALESCE(AVG(total_centavos), 0) as ticket_promedio_centavos
       FROM ventas WHERE estado = 'completada' AND fecha BETWEEN ? AND ?`
    )
    .get(desde, hasta);
}

/**
 * Rotación de inventario aproximada: costo de lo vendido en el período dividido entre
 * el valor de costo del inventario actual. Como no guardamos snapshots diarios de stock,
 * se usa el inventario actual como aproximación del inventario promedio del período.
 */
export function kpiRotacionInventario(desde: string, hasta: string) {
  const db = getDb();
  const costoVendido = db
    .prepare(
      `SELECT COALESCE(SUM(p.costo_centavos * vd.cantidad), 0) as costo_centavos
       FROM ventas_detalle vd
       JOIN ventas v ON v.id = vd.venta_id
       JOIN productos p ON p.id = vd.producto_id
       WHERE v.estado = 'completada' AND v.fecha BETWEEN ? AND ?`
    )
    .get(desde, hasta) as { costo_centavos: number };

  const valorInventarioActual = db
    .prepare(`SELECT COALESCE(SUM(costo_centavos * stock_actual), 0) as valor_centavos FROM productos WHERE estado = 'activo'`)
    .get() as { valor_centavos: number };

  const rotacion = valorInventarioActual.valor_centavos === 0 ? 0 : costoVendido.costo_centavos / valorInventarioActual.valor_centavos;

  return {
    costo_vendido_centavos: costoVendido.costo_centavos,
    valor_inventario_actual_centavos: valorInventarioActual.valor_centavos,
    rotacion: Math.round(rotacion * 100) / 100,
  };
}

/**
 * % de clientes nuevos (su primera compra cae dentro del período) vs. recurrentes
 * (ya habían comprado antes del período) entre quienes compraron en el período.
 */
export function kpiClientesNuevosVsRecurrentes(desde: string, hasta: string) {
  const db = getDb();
  const clientesDelPeriodo = db
    .prepare(
      `SELECT DISTINCT cliente_id FROM ventas
       WHERE estado = 'completada' AND cliente_id IS NOT NULL AND fecha BETWEEN ? AND ?`
    )
    .all(desde, hasta) as { cliente_id: number }[];

  let nuevos = 0;
  let recurrentes = 0;
  const primeraCompraStmt = db.prepare(
    "SELECT MIN(fecha) as primera FROM ventas WHERE cliente_id = ? AND estado = 'completada'"
  );

  for (const { cliente_id } of clientesDelPeriodo) {
    const { primera } = primeraCompraStmt.get(cliente_id) as { primera: string };
    if (primera >= desde) nuevos++;
    else recurrentes++;
  }

  const total = nuevos + recurrentes;
  return {
    nuevos,
    recurrentes,
    total,
    pct_nuevos: total === 0 ? 0 : Math.round((nuevos / total) * 1000) / 10,
    pct_recurrentes: total === 0 ? 0 : Math.round((recurrentes / total) * 1000) / 10,
  };
}

export function kpiIngresosPorCanal(desde: string, hasta: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT canal, COUNT(*) as num_ventas, COALESCE(SUM(total_centavos), 0) as ingresos_centavos
       FROM ventas WHERE estado = 'completada' AND fecha BETWEEN ? AND ?
       GROUP BY canal`
    )
    .all(desde, hasta);
}
