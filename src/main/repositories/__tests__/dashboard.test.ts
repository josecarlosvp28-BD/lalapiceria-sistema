import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { kpiClientesNuevosVsRecurrentes, kpiRotacionInventario } = await import("../dashboard");

function crearCliente(db: Database.Database, nombre: string) {
  const info = db.prepare("INSERT INTO clientes (nombre, tipo_cliente) VALUES (?, 'retail')").run(nombre);
  return Number(info.lastInsertRowid);
}

function crearProducto(db: Database.Database, costo: number, precio: number, stock: number) {
  const info = db
    .prepare(
      `INSERT INTO productos (sku, marca, modelo, categoria, costo_centavos, precio_centavos, stock_actual)
       VALUES (?, 'Parker', 'Jotter', 'lapicero', ?, ?, ?)`
    )
    .run(`SKU-${Math.random()}`, costo, precio, stock);
  return Number(info.lastInsertRowid);
}

function insertarVenta(
  db: Database.Database,
  cliente_id: number,
  fecha: string,
  producto_id: number,
  cantidad: number,
  precio: number
) {
  const venta = db
    .prepare(
      `INSERT INTO ventas (cliente_id, fecha, subtotal_centavos, total_centavos, estado)
       VALUES (?, ?, ?, ?, 'completada')`
    )
    .run(cliente_id, fecha, precio * cantidad, precio * cantidad);
  db.prepare(
    `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario_centavos, subtotal_centavos)
     VALUES (?, ?, ?, ?, ?)`
  ).run(venta.lastInsertRowid, producto_id, cantidad, precio, precio * cantidad);
}

describe("dashboard KPIs", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("clasifica como 'nuevo' a un cliente cuya primera compra cae dentro del período", () => {
    const producto_id = crearProducto(testDb, 500, 1000, 50);
    const clienteNuevo = crearCliente(testDb, "Cliente Nuevo");
    insertarVenta(testDb, clienteNuevo, "2026-06-15", producto_id, 1, 1000);

    const resultado = kpiClientesNuevosVsRecurrentes("2026-06-01", "2026-06-30") as any;
    expect(resultado.nuevos).toBe(1);
    expect(resultado.recurrentes).toBe(0);
  });

  it("clasifica como 'recurrente' a un cliente que ya había comprado antes del período", () => {
    const producto_id = crearProducto(testDb, 500, 1000, 50);
    const clienteRecurrente = crearCliente(testDb, "Cliente Recurrente");
    insertarVenta(testDb, clienteRecurrente, "2026-01-10", producto_id, 1, 1000); // compra previa
    insertarVenta(testDb, clienteRecurrente, "2026-06-15", producto_id, 1, 1000); // compra dentro del período

    const resultado = kpiClientesNuevosVsRecurrentes("2026-06-01", "2026-06-30") as any;
    expect(resultado.nuevos).toBe(0);
    expect(resultado.recurrentes).toBe(1);
  });

  it("calcula la rotación como costo vendido entre valor de inventario actual", () => {
    // costo unitario 500, precio 1000, stock actual 50 -> valor inventario = 25000
    const producto_id = crearProducto(testDb, 500, 1000, 50);
    insertarVenta(testDb, crearCliente(testDb, "Cliente"), "2026-06-15", producto_id, 10, 1000);
    // costo vendido = 500 * 10 = 5000; rotación = 5000 / 25000 = 0.2

    const resultado = kpiRotacionInventario("2026-06-01", "2026-06-30") as any;
    expect(resultado.costo_vendido_centavos).toBe(5000);
    expect(resultado.valor_inventario_actual_centavos).toBe(25000);
    expect(resultado.rotacion).toBe(0.2);
  });
});
