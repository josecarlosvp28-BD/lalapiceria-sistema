import { getDb } from "../../db";
import type { InventarioMovimiento, TipoMovimiento } from "../../shared/types";

/**
 * Única forma permitida de cambiar stock: siempre queda un registro en
 * inventario_movimientos, nunca se sobreescribe stock_actual directamente.
 */
export function registrarMovimiento(input: {
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  usuario_id?: number | null;
}): InventarioMovimiento {
  const db = getDb();
  const delta = input.tipo === "entrada" || input.tipo === "ajuste" ? input.cantidad : -input.cantidad;

  const tx = db.transaction(() => {
    const producto = db.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(input.producto_id) as
      | { stock_actual: number }
      | undefined;
    if (!producto) throw new Error("Producto no encontrado");

    const nuevoStock = producto.stock_actual + delta;
    if (nuevoStock < 0) {
      throw new Error("Stock insuficiente para esta operación");
    }

    db.prepare("UPDATE productos SET stock_actual = ?, updated_at = datetime('now') WHERE id = ?").run(
      nuevoStock,
      input.producto_id
    );

    const info = db
      .prepare(
        `INSERT INTO inventario_movimientos
          (producto_id, tipo, cantidad, motivo, referencia_tipo, referencia_id, usuario_id)
         VALUES (@producto_id, @tipo, @cantidad, @motivo, @referencia_tipo, @referencia_id, @usuario_id)`
      )
      .run({
        producto_id: input.producto_id,
        tipo: input.tipo,
        cantidad: input.cantidad,
        motivo: input.motivo ?? null,
        referencia_tipo: input.referencia_tipo ?? null,
        referencia_id: input.referencia_id ?? null,
        usuario_id: input.usuario_id ?? null,
      });

    return db
      .prepare("SELECT * FROM inventario_movimientos WHERE id = ?")
      .get(info.lastInsertRowid) as InventarioMovimiento;
  });

  return tx();
}

export function historialProducto(producto_id: number): InventarioMovimiento[] {
  return getDb()
    .prepare("SELECT * FROM inventario_movimientos WHERE producto_id = ? ORDER BY created_at DESC")
    .all(producto_id) as InventarioMovimiento[];
}
