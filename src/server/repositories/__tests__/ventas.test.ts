import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { crearVenta, VentaError } = await import("../ventas");

function crearProductoDePrueba(db: Database.Database, stock = 10, precio_centavos = 2000) {
  const info = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_actual)
       VALUES ('SKU-1', 'Parker', 'Jotter', 'lapicero', 1000, ?, ?)`
    )
    .run(precio_centavos, stock);
  return Number(info.lastInsertRowid);
}

describe("crearVenta", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("registra la venta, descuenta stock y guarda el pago", () => {
    const producto_id = crearProductoDePrueba(testDb, 10, 2000);

    const venta = crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [{ producto_id, cantidad: 2, precio_unitario_centavos: 2000, descuento_centavos: 0 }],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [{ metodo: "efectivo", monto_centavos: 4000 }],
    });

    expect(venta.total_centavos).toBe(4000);

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(8);

    const movimientos = testDb.prepare("SELECT * FROM inventario_movimientos WHERE producto_id = ?").all(producto_id);
    expect(movimientos).toHaveLength(1);
  });

  it("soporta pagos mixtos que sumen exactamente el total", () => {
    const producto_id = crearProductoDePrueba(testDb, 10, 3000);

    const venta = crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [{ producto_id, cantidad: 1, precio_unitario_centavos: 3000, descuento_centavos: 0 }],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [
        { metodo: "efectivo", monto_centavos: 1000 },
        { metodo: "tarjeta", monto_centavos: 2000 },
      ],
    });

    expect(venta.total_centavos).toBe(3000);
  });

  it("rechaza la venta si los pagos no cuadran con el total", () => {
    const producto_id = crearProductoDePrueba(testDb, 10, 2000);

    expect(() =>
      crearVenta({
        cliente_id: null,
        usuario_id: null,
        items: [{ producto_id, cantidad: 1, precio_unitario_centavos: 2000, descuento_centavos: 0 }],
        descuento_centavos: 0,
        descuento_motivo: null,
        pagos: [{ metodo: "efectivo", monto_centavos: 1500 }],
      })
    ).toThrow(VentaError);
  });

  it("exige motivo cuando hay descuento", () => {
    const producto_id = crearProductoDePrueba(testDb, 10, 2000);

    expect(() =>
      crearVenta({
        cliente_id: null,
        usuario_id: null,
        items: [{ producto_id, cantidad: 1, precio_unitario_centavos: 2000, descuento_centavos: 0 }],
        descuento_centavos: 500,
        descuento_motivo: null,
        pagos: [{ metodo: "efectivo", monto_centavos: 1500 }],
      })
    ).toThrow("motivo del descuento");
  });

  it("no permite vender más unidades que el stock disponible", () => {
    const producto_id = crearProductoDePrueba(testDb, 1, 2000);

    expect(() =>
      crearVenta({
        cliente_id: null,
        usuario_id: null,
        items: [{ producto_id, cantidad: 5, precio_unitario_centavos: 2000, descuento_centavos: 0 }],
        descuento_centavos: 0,
        descuento_motivo: null,
        pagos: [{ metodo: "efectivo", monto_centavos: 10000 }],
      })
    ).toThrow("Stock insuficiente");

    const producto = testDb.prepare("SELECT stock_actual FROM productos WHERE id = ?").get(producto_id) as any;
    expect(producto.stock_actual).toBe(1);
  });
});
