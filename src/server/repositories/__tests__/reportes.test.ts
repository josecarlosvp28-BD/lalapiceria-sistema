import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { crearVenta } = await import("../ventas");
const { reporteMargenPorPeriodo, reporteVentasPorMarca } = await import("../ventas");

function crearProducto(db: Database.Database, marca: string, costo: number, precio: number) {
  const info = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_actual)
       VALUES (?, ?, 'Modelo', 'lapicero', ?, ?, 100)`
    )
    .run(`SKU-${marca}-${Math.random()}`, marca, costo, precio);
  return Number(info.lastInsertRowid);
}

describe("reportes de ventas", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("calcula el margen como ingresos menos costo de los productos vendidos", () => {
    const producto_id = crearProducto(testDb, "Parker", 1000, 3000);
    crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [{ producto_id, cantidad: 2, precio_unitario_centavos: 3000, descuento_centavos: 0 }],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [{ metodo: "efectivo", monto_centavos: 6000 }],
    });

    const hoy = new Date().toISOString().slice(0, 10);
    const reporte = reporteMargenPorPeriodo(hoy, `${hoy}T23:59:59`, "day") as any[];

    expect(reporte).toHaveLength(1);
    expect(reporte[0].ingresos_centavos).toBe(6000);
    expect(reporte[0].costo_centavos).toBe(2000);
    expect(reporte[0].margen_centavos).toBe(4000);
  });

  it("agrupa ingresos por marca", () => {
    const parker = crearProducto(testDb, "Parker", 1000, 3000);
    const cross = crearProducto(testDb, "Cross", 1500, 4000);

    crearVenta({
      cliente_id: null,
      usuario_id: null,
      items: [
        { producto_id: parker, cantidad: 1, precio_unitario_centavos: 3000, descuento_centavos: 0 },
        { producto_id: cross, cantidad: 1, precio_unitario_centavos: 4000, descuento_centavos: 0 },
      ],
      descuento_centavos: 0,
      descuento_motivo: null,
      pagos: [{ metodo: "efectivo", monto_centavos: 7000 }],
    });

    const hoy = new Date().toISOString().slice(0, 10);
    const reporte = reporteVentasPorMarca(hoy, `${hoy}T23:59:59`) as any[];

    const marcas = reporte.map((r) => r.marca).sort();
    expect(marcas).toEqual(["Cross", "Parker"]);
  });
});
