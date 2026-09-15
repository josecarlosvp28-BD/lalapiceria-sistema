type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

function qs(params: Record<string, any>): string {
  const filtrados = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (filtrados.length === 0) return "";
  return "?" + filtrados.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<Resultado<T>> {
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event("sesion-expirada"));
      return { ok: false, error: "Sesión expirada, inicia sesión de nuevo" };
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const get = <T = any>(path: string, params: Record<string, any> = {}) => request<T>("GET", path + qs(params));
const post = <T = any>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
const put = <T = any>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {});

export const api = {
  productos: {
    listar: (filtros?: any) => get("/api/productos", filtros ?? {}),
    obtener: (id: number) => get(`/api/productos/${id}`),
    crear: (p: any) => post("/api/productos", p),
    actualizar: (id: number, p: any) => put(`/api/productos/${id}`, p),
    stockBajo: () => get("/api/productos/stock-bajo"),
  },
  inventario: {
    registrarMovimiento: (input: any) => post("/api/inventario/movimientos", input),
    historial: (producto_id: number) => get(`/api/inventario/productos/${producto_id}/historial`),
  },
  clientes: {
    listar: (busqueda?: string) => get("/api/clientes", { busqueda }),
    obtener: (id: number) => get(`/api/clientes/${id}`),
    crear: (c: any) => post("/api/clientes", c),
    actualizar: (id: number, c: any) => put(`/api/clientes/${id}`, c),
    historialCompras: (id: number) => get(`/api/clientes/${id}/compras`),
    paraSeguimiento: (dias: number) => get("/api/clientes/seguimiento", { dias }),
    porMarcaComprada: (marca: string, dias: number) => get("/api/clientes/por-marca", { marca, dias }),
    proximosCumpleanos: (dias: number) => get("/api/clientes/cumpleanos", { dias }),
  },
  ventas: {
    crear: (input: any) => post("/api/ventas", input),
    anular: (id: number, usuario_id: number | null, motivo: string) =>
      post(`/api/ventas/${id}/anular`, { usuario_id, motivo }),
    listar: (filtros?: any) => get("/api/ventas", filtros ?? {}),
    detalle: (id: number) => get(`/api/ventas/${id}`),
    reporteMasVendidos: (desde: string, hasta: string) => get("/api/ventas/reportes/mas-vendidos", { desde, hasta }),
    reportePorPeriodo: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      get("/api/ventas/reportes/por-periodo", { desde, hasta, agrupacion }),
    reportePorMarca: (desde: string, hasta: string) => get("/api/ventas/reportes/por-marca", { desde, hasta }),
    reportePorCategoria: (desde: string, hasta: string) => get("/api/ventas/reportes/por-categoria", { desde, hasta }),
    reporteMargen: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      get("/api/ventas/reportes/margen", { desde, hasta, agrupacion }),
    resumenComparativo: (desde: string, hasta: string, desdeAnterior: string, hastaAnterior: string) =>
      get("/api/ventas/reportes/comparativo", { desde, hasta, desdeAnterior, hastaAnterior }),
  },
  grabados: {
    listar: (filtros?: any) => get("/api/grabados", filtros ?? {}),
    obtener: (id: number) => get(`/api/grabados/${id}`),
    crear: (input: any) => post("/api/grabados", input),
    cambiarEstado: (id: number, estado: string) => put(`/api/grabados/${id}/estado`, { estado }),
    listasParaEntrega: () => get("/api/grabados/listas-para-entrega"),
    historialCliente: (id: number) => get(`/api/grabados/clientes/${id}/historial`),
  },
  cotizaciones: {
    listar: () => get("/api/cotizaciones"),
    obtener: (id: number) => get(`/api/cotizaciones/${id}`),
    crear: (input: any) => post("/api/cotizaciones", input),
    cambiarEstado: (id: number, estado: string) => put(`/api/cotizaciones/${id}/estado`, { estado }),
  },
  garantias: {
    listar: (filtros?: any) => get("/api/garantias", filtros ?? {}),
    crear: (input: any) => post("/api/garantias", input),
    cambiarEstado: (id: number, estado: string) => put(`/api/garantias/${id}/estado`, { estado }),
  },
  caja: {
    actual: () => get("/api/caja/actual"),
    montoEsperado: () => get("/api/caja/monto-esperado"),
    abrir: (monto: number, usuario_id: number | null) =>
      post("/api/caja/abrir", { monto_apertura_centavos: monto, usuario_id }),
    cerrar: (montoReal: number, usuario_id: number | null, notas: string | null) =>
      post("/api/caja/cerrar", { monto_cierre_real_centavos: montoReal, usuario_id, notas }),
    historial: () => get("/api/caja/historial"),
  },
  dashboard: {
    resumenGeneral: (desde: string, hasta: string) => get("/api/dashboard/resumen", { desde, hasta }),
    rotacionInventario: (desde: string, hasta: string) => get("/api/dashboard/rotacion-inventario", { desde, hasta }),
    clientesNuevosVsRecurrentes: (desde: string, hasta: string) =>
      get("/api/dashboard/clientes-nuevos-recurrentes", { desde, hasta }),
    ingresosPorCanal: (desde: string, hasta: string) => get("/api/dashboard/ingresos-por-canal", { desde, hasta }),
  },
  usuarios: {
    listar: () => get("/api/usuarios"),
    crear: (input: any) => post("/api/usuarios", input),
    cambiarEstado: (id: number, activo: boolean) => put(`/api/usuarios/${id}/estado`, { activo }),
  },
};

export async function login(email: string, password: string): Promise<Resultado<any>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}

export async function obtenerSesion(): Promise<Resultado<any>> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  return res.json();
}
