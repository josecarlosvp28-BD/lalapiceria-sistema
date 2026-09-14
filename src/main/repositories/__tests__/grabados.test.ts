import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { crearOrdenGrabado, cambiarEstadoOrdenGrabado, siguienteEstado } = await import("../grabados");

function crearClienteYProducto(db: Database.Database) {
  const cliente = db.prepare("INSERT INTO clientes (nombre, tipo_cliente) VALUES ('Ana Torres', 'retail')").run();
  const producto = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos)
       VALUES ('SKU-1', 'Cross', 'Century', 'lapicero', 1000, 3000)`
    )
    .run();
  return { cliente_id: Number(cliente.lastInsertRowid), producto_id: Number(producto.lastInsertRowid) };
}

describe("ordenes de grabado", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("una orden nueva empieza en estado 'recibido'", () => {
    const { cliente_id, producto_id } = crearClienteYProducto(testDb);
    const orden = crearOrdenGrabado({
      cliente_id,
      producto_id,
      venta_id: null,
      texto_grabado: "Para Juan, con cariño",
      tipo_fuente: null,
      posicion: null,
      imagen_referencia_path: null,
      fecha_entrega_estimada: null,
      responsable_id: null,
      costo_adicional_centavos: 500,
      notas: null,
    });
    expect(orden.estado).toBe("recibido");
    expect(orden.fecha_entrega_real).toBeNull();
  });

  it("sigue el flujo recibido -> en_proceso -> control_calidad -> listo -> entregado", () => {
    expect(siguienteEstado("recibido")).toBe("en_proceso");
    expect(siguienteEstado("en_proceso")).toBe("control_calidad");
    expect(siguienteEstado("control_calidad")).toBe("listo");
    expect(siguienteEstado("listo")).toBe("entregado");
    expect(siguienteEstado("entregado")).toBeNull();
  });

  it("marcar como 'entregado' registra la fecha de entrega real", () => {
    const { cliente_id, producto_id } = crearClienteYProducto(testDb);
    const orden = crearOrdenGrabado({
      cliente_id,
      producto_id,
      venta_id: null,
      texto_grabado: "Iniciales JP",
      tipo_fuente: null,
      posicion: null,
      imagen_referencia_path: null,
      fecha_entrega_estimada: null,
      responsable_id: null,
      costo_adicional_centavos: 0,
      notas: null,
    });

    const actualizada = cambiarEstadoOrdenGrabado(orden.id, "entregado");
    expect(actualizada.estado).toBe("entregado");
    expect(actualizada.fecha_entrega_real).not.toBeNull();
  });
});
