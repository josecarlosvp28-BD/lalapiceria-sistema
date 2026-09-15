import { getDb } from "../../db";

export type EstadoCotizacion = "cotizacion" | "aprobacion" | "produccion" | "entrega";

export interface ItemCotizacion {
  producto_id: number;
  cantidad: number;
  precio_unitario_centavos: number;
}

export interface NuevaCotizacion {
  cliente_id: number;
  descripcion: string | null;
  fecha_entrega_estimada: string | null;
  notas: string | null;
  items: ItemCotizacion[];
}

const SIGUIENTE: Record<EstadoCotizacion, EstadoCotizacion | null> = {
  cotizacion: "aprobacion",
  aprobacion: "produccion",
  produccion: "entrega",
  entrega: null,
};

export function siguienteEstadoCotizacion(estado: EstadoCotizacion): EstadoCotizacion | null {
  return SIGUIENTE[estado];
}

export function listarCotizaciones() {
  const db = getDb();
  return db
    .prepare(
      `SELECT cc.*, c.nombre as cliente_nombre
       FROM cotizaciones_corporativas cc
       JOIN clientes c ON c.id = cc.cliente_id
       ORDER BY cc.fecha_creacion DESC`
    )
    .all();
}

export function obtenerCotizacion(id: number) {
  const db = getDb();
  const cotizacion = db
    .prepare(
      `SELECT cc.*, c.nombre as cliente_nombre FROM cotizaciones_corporativas cc
       JOIN clientes c ON c.id = cc.cliente_id WHERE cc.id = ?`
    )
    .get(id);
  const items = db
    .prepare(
      `SELECT cd.*, p.marca, p.modelo FROM cotizaciones_detalle cd
       JOIN productos p ON p.id = cd.producto_id
       WHERE cd.cotizacion_id = ?`
    )
    .all(id);
  return { cotizacion, items };
}

export function crearCotizacion(input: NuevaCotizacion) {
  if (input.items.length === 0) throw new Error("La cotización debe tener al menos un producto");
  const total = input.items.reduce((acc, it) => acc + it.precio_unitario_centavos * it.cantidad, 0);

  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO cotizaciones_corporativas (cliente_id, descripcion, total_centavos, fecha_entrega_estimada, notas)
         VALUES (@cliente_id, @descripcion, @total_centavos, @fecha_entrega_estimada, @notas)`
      )
      .run({
        cliente_id: input.cliente_id,
        descripcion: input.descripcion,
        total_centavos: total,
        fecha_entrega_estimada: input.fecha_entrega_estimada,
        notas: input.notas,
      });
    const cotizacion_id = Number(info.lastInsertRowid);

    for (const item of input.items) {
      db.prepare(
        `INSERT INTO cotizaciones_detalle (cotizacion_id, producto_id, cantidad, precio_unitario_centavos)
         VALUES (@cotizacion_id, @producto_id, @cantidad, @precio_unitario_centavos)`
      ).run({ cotizacion_id, ...item });
    }

    return cotizacion_id;
  });

  const id = tx();
  return obtenerCotizacion(id);
}

export function cambiarEstadoCotizacion(id: number, estado: EstadoCotizacion) {
  const db = getDb();
  db.prepare("UPDATE cotizaciones_corporativas SET estado = ?, updated_at = datetime('now') WHERE id = ?").run(
    estado,
    id
  );
  return obtenerCotizacion(id);
}
