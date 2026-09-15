type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

async function rpc<T = any>(channel: string, ...args: any[]): Promise<Resultado<T>> {
  try {
    const res = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, args }),
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

export const api = {
  productos: {
    listar: (filtros?: any) => rpc("productos:listar", filtros),
    obtener: (id: number) => rpc("productos:obtener", id),
    crear: (p: any) => rpc("productos:crear", p),
    actualizar: (id: number, p: any) => rpc("productos:actualizar", id, p),
    stockBajo: () => rpc("productos:stockBajo"),
  },
  inventario: {
    registrarMovimiento: (input: any) => rpc("inventario:registrarMovimiento", input),
    historial: (producto_id: number) => rpc("inventario:historial", producto_id),
  },
  clientes: {
    listar: (busqueda?: string) => rpc("clientes:listar", busqueda),
    obtener: (id: number) => rpc("clientes:obtener", id),
    crear: (c: any) => rpc("clientes:crear", c),
    actualizar: (id: number, c: any) => rpc("clientes:actualizar", id, c),
    historialCompras: (id: number) => rpc("clientes:historialCompras", id),
    paraSeguimiento: (dias: number) => rpc("clientes:paraSeguimiento", dias),
    porMarcaComprada: (marca: string, dias: number) => rpc("clientes:porMarcaComprada", marca, dias),
    proximosCumpleanos: (dias: number) => rpc("clientes:proximosCumpleanos", dias),
  },
  ventas: {
    crear: (input: any) => rpc("ventas:crear", input),
    anular: (id: number, usuario_id: number | null, motivo: string) => rpc("ventas:anular", id, usuario_id, motivo),
    listar: (filtros?: any) => rpc("ventas:listar", filtros),
    detalle: (id: number) => rpc("ventas:detalle", id),
    reporteMasVendidos: (desde: string, hasta: string) => rpc("ventas:reporteMasVendidos", desde, hasta),
    reportePorPeriodo: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      rpc("ventas:reportePorPeriodo", desde, hasta, agrupacion),
    reportePorMarca: (desde: string, hasta: string) => rpc("ventas:reportePorMarca", desde, hasta),
    reportePorCategoria: (desde: string, hasta: string) => rpc("ventas:reportePorCategoria", desde, hasta),
    reporteMargen: (desde: string, hasta: string, agrupacion: "day" | "month" | "year") =>
      rpc("ventas:reporteMargen", desde, hasta, agrupacion),
    resumenComparativo: (desde: string, hasta: string, desdeAnterior: string, hastaAnterior: string) =>
      rpc("ventas:resumenComparativo", desde, hasta, desdeAnterior, hastaAnterior),
  },
  grabados: {
    listar: (filtros?: any) => rpc("grabados:listar", filtros),
    obtener: (id: number) => rpc("grabados:obtener", id),
    crear: (input: any) => rpc("grabados:crear", input),
    cambiarEstado: (id: number, estado: string) => rpc("grabados:cambiarEstado", id, estado),
    listasParaEntrega: () => rpc("grabados:listasParaEntrega"),
    historialCliente: (id: number) => rpc("grabados:historialCliente", id),
  },
  cotizaciones: {
    listar: () => rpc("cotizaciones:listar"),
    obtener: (id: number) => rpc("cotizaciones:obtener", id),
    crear: (input: any) => rpc("cotizaciones:crear", input),
    cambiarEstado: (id: number, estado: string) => rpc("cotizaciones:cambiarEstado", id, estado),
  },
  garantias: {
    listar: (filtros?: any) => rpc("garantias:listar", filtros),
    crear: (input: any) => rpc("garantias:crear", input),
    cambiarEstado: (id: number, estado: string) => rpc("garantias:cambiarEstado", id, estado),
  },
  caja: {
    actual: () => rpc("caja:actual"),
    montoEsperado: () => rpc("caja:montoEsperado"),
    abrir: (monto: number, usuario_id: number | null) => rpc("caja:abrir", monto, usuario_id),
    cerrar: (montoReal: number, usuario_id: number | null, notas: string | null) =>
      rpc("caja:cerrar", montoReal, usuario_id, notas),
    historial: () => rpc("caja:historial"),
  },
  dashboard: {
    resumenGeneral: (desde: string, hasta: string) => rpc("dashboard:resumenGeneral", desde, hasta),
    rotacionInventario: (desde: string, hasta: string) => rpc("dashboard:rotacionInventario", desde, hasta),
    clientesNuevosVsRecurrentes: (desde: string, hasta: string) =>
      rpc("dashboard:clientesNuevosVsRecurrentes", desde, hasta),
    ingresosPorCanal: (desde: string, hasta: string) => rpc("dashboard:ingresosPorCanal", desde, hasta),
  },
  usuarios: {
    listar: () => rpc("usuarios:listar"),
    crear: (input: any) => rpc("usuarios:crear", input),
    cambiarEstado: (id: number, activo: boolean) => rpc("usuarios:cambiarEstado", id, activo),
  },
  sistema: {
    backup: () => rpc("sistema:backup"),
  },
};

export async function login(email: string, password: string): Promise<Resultado<any>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function obtenerSesion(): Promise<Resultado<any>> {
  const res = await fetch("/api/auth/me");
  return res.json();
}
