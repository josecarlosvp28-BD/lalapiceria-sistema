import { getDb } from "../../db";
import type { NuevoProducto, Producto } from "../../shared/types";

export function listarProductos(filtros?: {
  busqueda?: string;
  marca?: string;
  categoria?: string;
  estado?: string;
}): Producto[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filtros?.busqueda) {
    clauses.push("(sku LIKE @busqueda OR marca LIKE @busqueda OR modelo LIKE @busqueda)");
    params.busqueda = `%${filtros.busqueda}%`;
  }
  if (filtros?.marca) {
    clauses.push("marca = @marca");
    params.marca = filtros.marca;
  }
  if (filtros?.categoria) {
    clauses.push("categoria = @categoria");
    params.categoria = filtros.categoria;
  }
  if (filtros?.estado) {
    clauses.push("estado = @estado");
    params.estado = filtros.estado;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM productos ${where} ORDER BY marca, modelo`)
    .all(params) as Producto[];
}

export function obtenerProducto(id: number): Producto | undefined {
  return getDb().prepare("SELECT * FROM productos WHERE id = ?").get(id) as Producto | undefined;
}

export function crearProducto(p: NuevoProducto): Producto {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO productos
        (sku, marca, modelo, categoria, variante_color, variante_acabado, variante_punta,
         costo_centavos, precio_centavos, proveedor_id, stock_minimo, ubicacion, estado)
       VALUES (@sku, @marca, @modelo, @categoria, @variante_color, @variante_acabado, @variante_punta,
         @costo_centavos, @precio_centavos, @proveedor_id, @stock_minimo, @ubicacion, @estado)`
    )
    .run(p);
  return obtenerProducto(Number(info.lastInsertRowid))!;
}

export function actualizarProducto(id: number, p: Partial<NuevoProducto>): Producto {
  const db = getDb();
  const actual = obtenerProducto(id);
  if (!actual) throw new Error("Producto no encontrado");
  const merged = { ...actual, ...p, id };
  db.prepare(
    `UPDATE productos SET
      sku = @sku, marca = @marca, modelo = @modelo, categoria = @categoria,
      variante_color = @variante_color, variante_acabado = @variante_acabado, variante_punta = @variante_punta,
      costo_centavos = @costo_centavos, precio_centavos = @precio_centavos, proveedor_id = @proveedor_id,
      stock_minimo = @stock_minimo, ubicacion = @ubicacion, estado = @estado,
      updated_at = datetime('now')
     WHERE id = @id`
  ).run(merged);
  return obtenerProducto(id)!;
}

export function productosStockBajo(): Producto[] {
  return getDb()
    .prepare("SELECT * FROM productos WHERE stock_actual <= stock_minimo AND estado = 'activo' ORDER BY marca")
    .all() as Producto[];
}

export function calcularMargen(costo_centavos: number, precio_centavos: number): number {
  if (precio_centavos === 0) return 0;
  return Math.round(((precio_centavos - costo_centavos) / precio_centavos) * 10000) / 100;
}
