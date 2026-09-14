import { getDb } from "../../db";
import type { EstadoGrabado, OrdenGrabado } from "../../shared/types";

export interface NuevaOrdenGrabado {
  cliente_id: number;
  producto_id: number;
  venta_id: number | null;
  texto_grabado: string;
  tipo_fuente: string | null;
  posicion: string | null;
  imagen_referencia_path: string | null;
  fecha_entrega_estimada: string | null;
  responsable_id: number | null;
  costo_adicional_centavos: number;
  notas: string | null;
}

const ORDEN_SIGUIENTE: Record<EstadoGrabado, EstadoGrabado | null> = {
  recibido: "en_proceso",
  en_proceso: "control_calidad",
  control_calidad: "listo",
  listo: "entregado",
  entregado: null,
};

export function listarOrdenesGrabado(filtros?: { estado?: EstadoGrabado }) {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filtros?.estado) {
    clauses.push("og.estado = @estado");
    params.estado = filtros.estado;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT og.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, p.marca, p.modelo
       FROM ordenes_grabado og
       JOIN clientes c ON c.id = og.cliente_id
       JOIN productos p ON p.id = og.producto_id
       ${where}
       ORDER BY
         CASE og.estado
           WHEN 'recibido' THEN 1
           WHEN 'en_proceso' THEN 2
           WHEN 'control_calidad' THEN 3
           WHEN 'listo' THEN 4
           WHEN 'entregado' THEN 5
         END,
         og.fecha_recepcion DESC`
    )
    .all(params);
}

export function obtenerOrdenGrabado(id: number): OrdenGrabado | undefined {
  return getDb().prepare("SELECT * FROM ordenes_grabado WHERE id = ?").get(id) as OrdenGrabado | undefined;
}

export function crearOrdenGrabado(input: NuevaOrdenGrabado): OrdenGrabado {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO ordenes_grabado
        (cliente_id, producto_id, venta_id, texto_grabado, tipo_fuente, posicion, imagen_referencia_path,
         fecha_entrega_estimada, responsable_id, costo_adicional_centavos, notas)
       VALUES (@cliente_id, @producto_id, @venta_id, @texto_grabado, @tipo_fuente, @posicion, @imagen_referencia_path,
         @fecha_entrega_estimada, @responsable_id, @costo_adicional_centavos, @notas)`
    )
    .run(input);
  return obtenerOrdenGrabado(Number(info.lastInsertRowid))!;
}

export function cambiarEstadoOrdenGrabado(id: number, estado: EstadoGrabado): OrdenGrabado {
  const db = getDb();
  const orden = obtenerOrdenGrabado(id);
  if (!orden) throw new Error("Orden de grabado no encontrada");

  if (estado === "entregado") {
    db.prepare(
      "UPDATE ordenes_grabado SET estado = ?, fecha_entrega_real = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(estado, id);
  } else {
    db.prepare("UPDATE ordenes_grabado SET estado = ?, updated_at = datetime('now') WHERE id = ?").run(estado, id);
  }
  return obtenerOrdenGrabado(id)!;
}

export function siguienteEstado(estado: EstadoGrabado): EstadoGrabado | null {
  return ORDEN_SIGUIENTE[estado];
}

export function ordenesListasParaEntrega() {
  const db = getDb();
  return db
    .prepare(
      `SELECT og.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, p.marca, p.modelo
       FROM ordenes_grabado og
       JOIN clientes c ON c.id = og.cliente_id
       JOIN productos p ON p.id = og.producto_id
       WHERE og.estado = 'listo'
       ORDER BY og.updated_at`
    )
    .all();
}

export function historialGrabadosCliente(cliente_id: number) {
  return getDb()
    .prepare(
      `SELECT og.*, p.marca, p.modelo FROM ordenes_grabado og
       JOIN productos p ON p.id = og.producto_id
       WHERE og.cliente_id = ?
       ORDER BY og.fecha_recepcion DESC`
    )
    .all(cliente_id);
}
