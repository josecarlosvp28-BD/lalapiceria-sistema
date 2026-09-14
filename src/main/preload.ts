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
  },
  sistema: {
    backup: () => ipcRenderer.invoke("sistema:backup"),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
