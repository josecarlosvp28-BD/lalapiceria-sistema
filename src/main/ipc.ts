import { ipcMain } from "electron";
import * as productos from "./repositories/productos";
import * as inventario from "./repositories/inventario";
import * as clientes from "./repositories/clientes";
import * as ventas from "./repositories/ventas";
import { backupDatabase } from "../db";

function handle(channel: string, fn: (...args: any[]) => any) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

export function registerIpcHandlers() {
  // Productos
  handle("productos:listar", (filtros) => productos.listarProductos(filtros));
  handle("productos:obtener", (id) => productos.obtenerProducto(id));
  handle("productos:crear", (p) => productos.crearProducto(p));
  handle("productos:actualizar", (id, p) => productos.actualizarProducto(id, p));
  handle("productos:stockBajo", () => productos.productosStockBajo());

  // Inventario
  handle("inventario:registrarMovimiento", (input) => inventario.registrarMovimiento(input));
  handle("inventario:historial", (producto_id) => inventario.historialProducto(producto_id));

  // Clientes
  handle("clientes:listar", (busqueda) => clientes.listarClientes(busqueda));
  handle("clientes:obtener", (id) => clientes.obtenerCliente(id));
  handle("clientes:crear", (c) => clientes.crearCliente(c));
  handle("clientes:actualizar", (id, c) => clientes.actualizarCliente(id, c));
  handle("clientes:historialCompras", (id) => clientes.historialComprasCliente(id));

  // Ventas
  handle("ventas:crear", (input) => ventas.crearVenta(input));
  handle("ventas:anular", (id, usuario_id, motivo) => ventas.anularVenta(id, usuario_id, motivo));
  handle("ventas:listar", (filtros) => ventas.listarVentas(filtros));
  handle("ventas:detalle", (id) => ventas.detalleVenta(id));
  handle("ventas:reporteMasVendidos", (desde, hasta) => ventas.reporteMasVendidos(desde, hasta));
  handle("ventas:reportePorPeriodo", (desde, hasta, agrupacion) =>
    ventas.reporteVentasPorPeriodo(desde, hasta, agrupacion)
  );

  // Sistema
  handle("sistema:backup", () => backupDatabase());
}
