import * as productos from "./repositories/productos";
import * as inventario from "./repositories/inventario";
import * as clientes from "./repositories/clientes";
import * as ventas from "./repositories/ventas";
import * as grabados from "./repositories/grabados";
import * as cotizaciones from "./repositories/cotizaciones";
import * as garantias from "./repositories/garantias";
import * as caja from "./repositories/caja";
import * as dashboard from "./repositories/dashboard";
import * as usuarios from "./repositories/usuarios";
import { backupDatabase } from "../db";

type Handler = (...args: any[]) => any;

export const handlers: Record<string, Handler> = {
  // Productos
  "productos:listar": (filtros) => productos.listarProductos(filtros),
  "productos:obtener": (id) => productos.obtenerProducto(id),
  "productos:crear": (p) => productos.crearProducto(p),
  "productos:actualizar": (id, p) => productos.actualizarProducto(id, p),
  "productos:stockBajo": () => productos.productosStockBajo(),

  // Inventario
  "inventario:registrarMovimiento": (input) => inventario.registrarMovimiento(input),
  "inventario:historial": (producto_id) => inventario.historialProducto(producto_id),

  // Clientes
  "clientes:listar": (busqueda) => clientes.listarClientes(busqueda),
  "clientes:obtener": (id) => clientes.obtenerCliente(id),
  "clientes:crear": (c) => clientes.crearCliente(c),
  "clientes:actualizar": (id, c) => clientes.actualizarCliente(id, c),
  "clientes:historialCompras": (id) => clientes.historialComprasCliente(id),
  "clientes:paraSeguimiento": (dias) => clientes.clientesParaSeguimiento(dias),
  "clientes:porMarcaComprada": (marca, dias) => clientes.clientesPorMarcaComprada(marca, dias),
  "clientes:proximosCumpleanos": (dias) => clientes.proximosCumpleanos(dias),

  // Ventas
  "ventas:crear": (input) => ventas.crearVenta(input),
  "ventas:anular": (id, usuario_id, motivo) => ventas.anularVenta(id, usuario_id, motivo),
  "ventas:listar": (filtros) => ventas.listarVentas(filtros),
  "ventas:detalle": (id) => ventas.detalleVenta(id),
  "ventas:reporteMasVendidos": (desde, hasta) => ventas.reporteMasVendidos(desde, hasta),
  "ventas:reportePorPeriodo": (desde, hasta, agrupacion) => ventas.reporteVentasPorPeriodo(desde, hasta, agrupacion),
  "ventas:reportePorMarca": (desde, hasta) => ventas.reporteVentasPorMarca(desde, hasta),
  "ventas:reportePorCategoria": (desde, hasta) => ventas.reporteVentasPorCategoria(desde, hasta),
  "ventas:reporteMargen": (desde, hasta, agrupacion) => ventas.reporteMargenPorPeriodo(desde, hasta, agrupacion),
  "ventas:resumenComparativo": (desde, hasta, desdeAnterior, hastaAnterior) =>
    ventas.resumenComparativo(desde, hasta, desdeAnterior, hastaAnterior),

  // Grabados
  "grabados:listar": (filtros) => grabados.listarOrdenesGrabado(filtros),
  "grabados:obtener": (id) => grabados.obtenerOrdenGrabado(id),
  "grabados:crear": (input) => grabados.crearOrdenGrabado(input),
  "grabados:cambiarEstado": (id, estado) => grabados.cambiarEstadoOrdenGrabado(id, estado),
  "grabados:listasParaEntrega": () => grabados.ordenesListasParaEntrega(),
  "grabados:historialCliente": (id) => grabados.historialGrabadosCliente(id),

  // Cotizaciones corporativas
  "cotizaciones:listar": () => cotizaciones.listarCotizaciones(),
  "cotizaciones:obtener": (id) => cotizaciones.obtenerCotizacion(id),
  "cotizaciones:crear": (input) => cotizaciones.crearCotizacion(input),
  "cotizaciones:cambiarEstado": (id, estado) => cotizaciones.cambiarEstadoCotizacion(id, estado),

  // Garantías y reparaciones
  "garantias:listar": (filtros) => garantias.listarGarantias(filtros),
  "garantias:crear": (input) => garantias.crearGarantia(input),
  "garantias:cambiarEstado": (id, estado) => garantias.cambiarEstadoGarantia(id, estado),

  // Caja diaria
  "caja:actual": () => caja.cajaAbierta(),
  "caja:montoEsperado": () => caja.montoEsperadoActual(),
  "caja:abrir": (monto, usuario_id) => caja.abrirCaja(monto, usuario_id),
  "caja:cerrar": (montoReal, usuario_id, notas) => caja.cerrarCaja(montoReal, usuario_id, notas),
  "caja:historial": () => caja.historialCaja(),

  // Dashboard / KPIs
  "dashboard:resumenGeneral": (desde, hasta) => dashboard.kpiResumenGeneral(desde, hasta),
  "dashboard:rotacionInventario": (desde, hasta) => dashboard.kpiRotacionInventario(desde, hasta),
  "dashboard:clientesNuevosVsRecurrentes": (desde, hasta) => dashboard.kpiClientesNuevosVsRecurrentes(desde, hasta),
  "dashboard:ingresosPorCanal": (desde, hasta) => dashboard.kpiIngresosPorCanal(desde, hasta),

  // Usuarios
  "usuarios:listar": () => usuarios.listarUsuarios(),
  "usuarios:crear": (input) => usuarios.crearUsuario(input),
  "usuarios:cambiarEstado": (id, activo) => usuarios.cambiarEstadoUsuario(id, activo),

  // Sistema
  "sistema:backup": () => backupDatabase(),
};
