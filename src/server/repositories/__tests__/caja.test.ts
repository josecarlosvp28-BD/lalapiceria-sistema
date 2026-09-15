import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { abrirCaja, cerrarCaja, cajaAbierta, CajaError } = await import("../caja");
const { crearVenta } = await import("../ventas");

function crearProducto(db: Database.Database, precio: number) {
  const info = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_actual)
       VALUES ('SKU-1', 'Parker', 'Jotter', 'lapicero', 500, ?, 100)`
    )
    .run(precio);
  return Number(info.lastInsertRowid);
}

describe("caja diaria", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("no permite abrir una segunda caja si ya hay una abierta", () => {
    abrirCaja(10000, null);
    expect(() => abrirCaja(5000, null)).toThrow(CajaError);
  });

  it("el monto esperado al cerrar es apertura + ventas en efectivo, sin contar tarjeta/transferencia", () => {
    abrirCaja(10000, null); // S/ 100.00 de apertura
    const producto_id = crearProducto(testDb, 5000); // S/ 50.00

    crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [{ producto_id, cantidad: 1, precio_unitario_centavos: 5000, descuento_centavos: 0 }],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [{ metodo: "efectivo", monto_centavos: 5000 }],
    });

    crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [{ producto_id, cantidad: 1, precio_unitario_centavos: 5000, descuento_centavos: 0 }],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [{ metodo: "tarjeta", monto_centavos: 5000 }],
    });

    // Cierra contando exactamente lo esperado: 100 (apertura) + 50 (venta en efectivo) = 150
    const cerrada = cerrarCaja(15000, null, null) as any;

    expect(cerrada.monto_cierre_esperado_centavos).toBe(15000);
    expect(cerrada.diferencia_centavos).toBe(0);
  });

  it("registra una diferencia positiva o negativa cuando el conteo real no coincide", () => {
    abrirCaja(10000, null);
    const cerrada = cerrarCaja(9500, null, "faltante de caja chica") as any;

    expect(cerrada.monto_cierre_esperado_centavos).toBe(10000);
    expect(cerrada.monto_cierre_real_centavos).toBe(9500);
    expect(cerrada.diferencia_centavos).toBe(-500);
  });

  it("no permite cerrar si no hay caja abierta", () => {
    expect(() => cerrarCaja(1000, null, null)).toThrow("No hay una caja abierta");
  });

  it("después de cerrar, ya no hay una caja abierta", () => {
    abrirCaja(10000, null);
    cerrarCaja(10000, null, null);
    expect(cajaAbierta()).toBeUndefined();
  });
});
