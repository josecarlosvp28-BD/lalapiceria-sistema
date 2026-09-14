import { getDb } from "../../db";

export type EstadoGarantia = "en_revision" | "en_reparacion" | "listo" | "entregado" | "no_procede";

export interface NuevaGarantia {
  cliente_id: number;
  producto_id: number | null;
  venta_id: number | null;
  marca: string | null;
  falla: string;
  notas: string | null;
}

export function listarGarantias(filtros?: { estado?: EstadoGarantia }) {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filtros?.estado) {
    clauses.push("g.estado = @estado");
    params.estado = filtros.estado;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT g.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
       FROM garantias g
       JOIN clientes c ON c.id = g.cliente_id
       ${where}
       ORDER BY g.fecha_ingreso DESC`
    )
    .all(params);
}

export function crearGarantia(input: NuevaGarantia) {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO garantias (cliente_id, producto_id, venta_id, marca, falla, notas)
       VALUES (@cliente_id, @producto_id, @venta_id, @marca, @falla, @notas)`
    )
    .run(input);
  return db.prepare("SELECT * FROM garantias WHERE id = ?").get(info.lastInsertRowid);
}

export function cambiarEstadoGarantia(id: number, estado: EstadoGarantia) {
  const db = getDb();
  if (estado === "entregado") {
    db.prepare(
      "UPDATE garantias SET estado = ?, fecha_entrega = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(estado, id);
  } else {
    db.prepare("UPDATE garantias SET estado = ?, updated_at = datetime('now') WHERE id = ?").run(estado, id);
  }
  return db.prepare("SELECT * FROM garantias WHERE id = ?").get(id);
}
