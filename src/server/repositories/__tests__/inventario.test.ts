import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { registrarMovimiento, historialProducto } = await import("../inventario");

function crearProductoDePrueba(db: Database.Database, stock_minimo = 5) {
  const info = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_minimo)
       VALUES ('SKU-1', 'Parker', 'Jotter', 'lapicero', 1000, 2000, ?)`
    )
    .run(stock_minimo);
  return Number(info.lastInsertRowid);
}

describe("registrarMovimiento", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("una entrada incrementa el stock y queda registrada", () => {
    const producto_id = crearProductoDePrueba(testDb);
    registrarMovimiento({ producto_id, tipo: "entrada", cantidad: 10, motivo: "Compra inicial" });

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(10);

    const historial = historialProducto(producto_id);
    expect(historial).toHaveLength(1);
    expect(historial[0].tipo).toBe("entrada");
  });

  it("una salida reduce el stock", () => {
    const producto_id = crearProductoDePrueba(testDb);
    registrarMovimiento({ producto_id, tipo: "entrada", cantidad: 10 });
    registrarMovimiento({ producto_id, tipo: "salida", cantidad: 3, motivo: "Venta" });

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(7);
  });

  it("nunca permite que el stock quede negativo", () => {
    const producto_id = crearProductoDePrueba(testDb);
    registrarMovimiento({ producto_id, tipo: "entrada", cantidad: 2 });

    expect(() => registrarMovimiento({ producto_id, tipo: "salida", cantidad: 5 })).toThrow(
      "Stock insuficiente"
    );

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(2);
  });

  it("una merma también reduce el stock y se distingue de una salida por venta", () => {
    const producto_id = crearProductoDePrueba(testDb);
    registrarMovimiento({ producto_id, tipo: "entrada", cantidad: 10 });
    registrarMovimiento({ producto_id, tipo: "merma", cantidad: 1, motivo: "Producto dañado" });

    const historial = historialProducto(producto_id);
    expect(historial.find((m) => m.tipo === "merma")).toBeTruthy();

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(9);
  });
});
