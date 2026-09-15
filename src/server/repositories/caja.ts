import { getDb } from "../../db";

export class CajaError extends Error {}

export function cajaAbierta() {
  return getDb().prepare("SELECT * FROM caja_diaria WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1").get();
}

export function abrirCaja(monto_apertura_centavos: number, usuario_apertura_id: number | null) {
  const db = getDb();
  const yaAbierta = cajaAbierta();
  if (yaAbierta) throw new CajaError("Ya existe una caja abierta. Ciérrala antes de abrir una nueva.");

  const info = db
    .prepare(
      "INSERT INTO caja_diaria (usuario_apertura_id, monto_apertura_centavos, estado) VALUES (?, ?, 'abierta')"
    )
    .run(usuario_apertura_id, monto_apertura_centavos);
  return db.prepare("SELECT * FROM caja_diaria WHERE id = ?").get(info.lastInsertRowid);
}

/**
 * Monto esperado en caja: apertura + ventas en efectivo registradas desde que se abrió la caja.
 */
function calcularMontoEsperado(caja: any): number {
  const db = getDb();
  const ventasEfectivo = db
    .prepare(
      `SELECT COALESCE(SUM(vp.monto_centavos), 0) as total
       FROM ventas_pagos vp
       JOIN ventas v ON v.id = vp.venta_id
       WHERE vp.metodo = 'efectivo' AND v.estado = 'completada' AND v.fecha >= ?`
    )
    .get(caja.created_at) as { total: number };

  return caja.monto_apertura_centavos + ventasEfectivo.total;
}

export function montoEsperadoActual() {
  const caja = cajaAbierta();
  if (!caja) return null;
  return calcularMontoEsperado(caja);
}

export function cerrarCaja(
  monto_cierre_real_centavos: number,
  usuario_cierre_id: number | null,
  notas: string | null
) {
  const db = getDb();
  const caja = cajaAbierta();
  if (!caja) throw new CajaError("No hay una caja abierta para cerrar");

  const esperado = calcularMontoEsperado(caja);
  const diferencia = monto_cierre_real_centavos - esperado;

  db.prepare(
    `UPDATE caja_diaria SET
      estado = 'cerrada', usuario_cierre_id = ?, monto_cierre_esperado_centavos = ?,
      monto_cierre_real_centavos = ?, diferencia_centavos = ?, notas = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(usuario_cierre_id, esperado, monto_cierre_real_centavos, diferencia, notas, (caja as any).id);

  return db.prepare("SELECT * FROM caja_diaria WHERE id = ?").get((caja as any).id);
}

export function historialCaja() {
  return getDb().prepare("SELECT * FROM caja_diaria ORDER BY fecha DESC LIMIT 60").all();
}
