import { ipcMain, shell } from "electron";
import * as productos from "./repositories/productos";
import * as inventario from "./repositories/inventario";
import * as clientes from "./repositories/clientes";
import * as ventas from "./repositories/ventas";
import * as grabados from "./repositories/grabados";
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
  handle("ventas:reportePorMarca", (desde, hasta) => ventas.reporteVentasPorMarca(desde, hasta));
  handle("ventas:reportePorCategoria", (desde, hasta) => ventas.reporteVentasPorCategoria(desde, hasta));
  handle("ventas:reporteMargen", (desde, hasta, agrupacion) =>
    ventas.reporteMargenPorPeriodo(desde, hasta, agrupacion)
  );
  handle("ventas:resumenComparativo", (desde, hasta, desdeAnterior, hastaAnterior) =>
    ventas.resumenComparativo(desde, hasta, desdeAnterior, hastaAnterior)
  );

  // Grabados
  handle("grabados:listar", (filtros) => grabados.listarOrdenesGrabado(filtros));
  handle("grabados:obtener", (id) => grabados.obtenerOrdenGrabado(id));
  handle("grabados:crear", (input) => grabados.crearOrdenGrabado(input));
  handle("grabados:cambiarEstado", (id, estado) => grabados.cambiarEstadoOrdenGrabado(id, estado));
  handle("grabados:listasParaEntrega", () => grabados.ordenesListasParaEntrega());
  handle("grabados:historialCliente", (id) => grabados.historialGrabadosCliente(id));

  // Sistema
  handle("sistema:backup", () => backupDatabase());
  handle("sistema:abrirWhatsApp", (telefono: string, mensaje: string) => {
    const numero = telefono.replace(/[^0-9]/g, "");
    const url = `https://wa.me/51${numero}?text=${encodeURIComponent(mensaje)}`;
    return shell.openExternal(url);
  });
}
