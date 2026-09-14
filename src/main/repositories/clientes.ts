import { getDb } from "../../db";
import type { Cliente, NuevoCliente } from "../../shared/types";

export function listarClientes(busqueda?: string): Cliente[] {
  const db = getDb();
  if (busqueda) {
    return db
      .prepare(
        "SELECT * FROM clientes WHERE nombre LIKE @q OR dni_ruc LIKE @q OR telefono LIKE @q ORDER BY nombre"
      )
      .all({ q: `%${busqueda}%` }) as Cliente[];
  }
  return db.prepare("SELECT * FROM clientes ORDER BY nombre").all() as Cliente[];
}

export function obtenerCliente(id: number): Cliente | undefined {
  return getDb().prepare("SELECT * FROM clientes WHERE id = ?").get(id) as Cliente | undefined;
}

export function crearCliente(c: NuevoCliente): Cliente {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO clientes
        (nombre, dni_ruc, telefono, email, direccion, fecha_nacimiento, tipo_cliente, marca_favorita, presupuesto_rango, notas)
       VALUES (@nombre, @dni_ruc, @telefono, @email, @direccion, @fecha_nacimiento, @tipo_cliente, @marca_favorita, @presupuesto_rango, @notas)`
    )
    .run(c);
  return obtenerCliente(Number(info.lastInsertRowid))!;
}

export function actualizarCliente(id: number, c: Partial<NuevoCliente>): Cliente {
  const db = getDb();
  const actual = obtenerCliente(id);
  if (!actual) throw new Error("Cliente no encontrado");
  const merged = { ...actual, ...c, id };
  db.prepare(
    `UPDATE clientes SET
      nombre=@nombre, dni_ruc=@dni_ruc, telefono=@telefono, email=@email, direccion=@direccion,
      fecha_nacimiento=@fecha_nacimiento, tipo_cliente=@tipo_cliente, marca_favorita=@marca_favorita,
      presupuesto_rango=@presupuesto_rango, notas=@notas, updated_at=datetime('now')
     WHERE id=@id`
  ).run(merged);
  return obtenerCliente(id)!;
}

/**
 * Clientes sin compras en los últimos `dias`, para seguimiento post-venta.
 */
export function clientesParaSeguimiento(dias: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, MAX(v.fecha) as ultima_compra
       FROM clientes c
       JOIN ventas v ON v.cliente_id = c.id AND v.estado = 'completada'
       GROUP BY c.id
       HAVING MAX(v.fecha) < datetime('now', '-' || ? || ' days')
       ORDER BY ultima_compra`
    )
    .all(dias);
}

/**
 * Clientes que compraron una marca específica en los últimos `dias`, para campañas segmentadas.
 */
export function clientesPorMarcaComprada(marca: string, dias: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT c.*
       FROM clientes c
       JOIN ventas v ON v.cliente_id = c.id AND v.estado = 'completada'
       JOIN ventas_detalle vd ON vd.venta_id = v.id
       JOIN productos p ON p.id = vd.producto_id
       WHERE p.marca = ? AND v.fecha >= datetime('now', '-' || ? || ' days')
       ORDER BY c.nombre`
    )
    .all(marca, dias);
}

/**
 * Cumpleaños dentro de los próximos `dias` días, para remarketing de regalos.
 */
export function proximosCumpleanos(dias: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM clientes
       WHERE fecha_nacimiento IS NOT NULL AND fecha_nacimiento != ''
       AND (
         strftime('%m-%d', fecha_nacimiento) BETWEEN strftime('%m-%d', 'now') AND strftime('%m-%d', 'now', '+' || ? || ' days')
       )
       ORDER BY strftime('%m-%d', fecha_nacimiento)`
    )
    .all(dias);
}

export function historialComprasCliente(cliente_id: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT v.*, GROUP_CONCAT(p.marca || ' ' || p.modelo, ', ') as productos
       FROM ventas v
       LEFT JOIN ventas_detalle vd ON vd.venta_id = v.id
       LEFT JOIN productos p ON p.id = vd.producto_id
       WHERE v.cliente_id = ? AND v.estado = 'completada'
       GROUP BY v.id
       ORDER BY v.fecha DESC`
    )
    .all(cliente_id);
}
