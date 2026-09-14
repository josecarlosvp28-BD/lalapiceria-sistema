import { contextBridge, ipcRenderer } from "electron";

const api = {
  productos: {
    listar: (filtros?: any) => ipcRenderer.invoke("productos:listar", filtros),
    obtener: (id: number) => ipcRenderer.invoke("productos:obtener", id),
    crear: (p: any) => ipcRenderer.invoke("productos:crear", p),
    actualizar: (id: number, p: any) => ipcRenderer.invoke("productos:actualizar", id, p),
    stockBajo: () => ipcRenderer.invoke("productos:stockBajo"),
  },
  inventario: {
    registrarMovimiento: (input: any) => ipcRenderer.invoke("inventario:registrarMovimiento", input),
    historial: (producto_id: number) => ipcRenderer.invoke("inventario:historial", producto_id),
  },
  clientes: {
    listar: (busqueda?: string) => ipcRenderer.invoke("clientes:listar", busqueda),
    obtener: (id: number) => ipcRenderer.invoke("clientes:obtener", id),
    crear: (c: any) => ipcRenderer.invoke("clientes:crear", c),
    actualizar: (id: number, c: any) => ipcRenderer.invoke("clientes:actualizar", id, c),
    historialCompras: (id: number) => ipcRenderer.invoke("clientes:historialCompras", id),
    paraSeguimiento: (dias: number) => ipcRenderer.invoke("clientes:paraSeguimiento", dias),
    porMarcaComprada: (marca: string, dias: number) => ipcRenderer.invoke("clientes:porMarcaComprada", marca, dias),
    proximosCumpleanos: (dias: number) => ipcRenderer.invoke("clientes:proximosCumpleanos", dias),
  },
  ventas: {
    crear: (input: any) => ipcRenderer.invoke("ventas:crear", input),
    anular: (id: number, usuario_id: number | null, motivo: string) =>
      ipcRenderer.invoke("ventas:anular", id, usuario_id, motivo),
    listar: (filtros?: any) => ipcRenderer.invoke("ventas:listar", filtros),
    detalle: (id: number) => ipcRenderer.invoke("ventas:detalle", id),
    reporteMasVendidos: (desde: string, hasta: string) =>
      ipcRenderer.invoke("ventas:reporteMasVendidos", desde, hasta),
    reportePorPeriodo: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      ipcRenderer.invoke("ventas:reportePorPeriodo", desde, hasta, agrupacion),
    reportePorMarca: (desde: string, hasta: string) => ipcRenderer.invoke("ventas:reportePorMarca", desde, hasta),
    reportePorCategoria: (desde: string, hasta: string) =>
      ipcRenderer.invoke("ventas:reportePorCategoria", desde, hasta),
    reporteMargen: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      ipcRenderer.invoke("ventas:reporteMargen", desde, hasta, agrupacion),
    resumenComparativo: (desde: string, hasta: string, desdeAnterior: string, hastaAnterior: string) =>
      ipcRenderer.invoke("ventas:resumenComparativo", desde, hasta, desdeAnterior, hastaAnterior),
  },
  grabados: {
    listar: (filtros?: any) => ipcRenderer.invoke("grabados:listar", filtros),
    obtener: (id: number) => ipcRenderer.invoke("grabados:obtener", id),
    crear: (input: any) => ipcRenderer.invoke("grabados:crear", input),
    cambiarEstado: (id: number, estado: string) => ipcRenderer.invoke("grabados:cambiarEstado", id, estado),
    listasParaEntrega: () => ipcRenderer.invoke("grabados:listasParaEntrega"),
    historialCliente: (id: number) => ipcRenderer.invoke("grabados:historialCliente", id),
  },
  cotizaciones: {
    listar: () => ipcRenderer.invoke("cotizaciones:listar"),
    obtener: (id: number) => ipcRenderer.invoke("cotizaciones:obtener", id),
    crear: (input: any) => ipcRenderer.invoke("cotizaciones:crear", input),
    cambiarEstado: (id: number, estado: string) => ipcRenderer.invoke("cotizaciones:cambiarEstado", id, estado),
    generarPDF: (id: number) => ipcRenderer.invoke("cotizaciones:generarPDF", id),
  },
  garantias: {
    listar: (filtros?: any) => ipcRenderer.invoke("garantias:listar", filtros),
    crear: (input: any) => ipcRenderer.invoke("garantias:crear", input),
    cambiarEstado: (id: number, estado: string) => ipcRenderer.invoke("garantias:cambiarEstado", id, estado),
  },
  caja: {
    actual: () => ipcRenderer.invoke("caja:actual"),
    montoEsperado: () => ipcRenderer.invoke("caja:montoEsperado"),
    abrir: (monto: number, usuario_id: number | null) => ipcRenderer.invoke("caja:abrir", monto, usuario_id),
    cerrar: (montoReal: number, usuario_id: number | null, notas: string | null) =>
      ipcRenderer.invoke("caja:cerrar", montoReal, usuario_id, notas),
    historial: () => ipcRenderer.invoke("caja:historial"),
  },
  sistema: {
    backup: () => ipcRenderer.invoke("sistema:backup"),
    abrirWhatsApp: (telefono: string, mensaje: string) =>
      ipcRenderer.invoke("sistema:abrirWhatsApp", telefono, mensaje),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
