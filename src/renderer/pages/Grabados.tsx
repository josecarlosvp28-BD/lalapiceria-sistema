import { useEffect, useState } from "react";
import type { Cliente, Producto, EstadoGrabado } from "../../shared/types";
import { formatoSoles } from "../lib/format";

const COLUMNAS: { estado: EstadoGrabado; label: string }[] = [
  { estado: "recibido", label: "Recibido" },
  { estado: "en_proceso", label: "En proceso" },
  { estado: "control_calidad", label: "Control de calidad" },
  { estado: "listo", label: "Listo para entrega" },
  { estado: "entregado", label: "Entregado" },
];

const FORM_VACIO = {
  cliente_id: "" as number | "",
  producto_id: "" as number | "",
  texto_grabado: "",
  tipo_fuente: "",
  posicion: "",
  fecha_entrega_estimada: "",
  costo_adicional_centavos: 0,
  notas: "",
};

export default function Grabados() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [resultadosProducto, setResultadosProducto] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await window.api.grabados.listar();
    if (res.ok) setOrdenes(res.data);
  }

  useEffect(() => {
    cargar();
    window.api.clientes.listar().then((r) => r.ok && setClientes(r.data));
  }, []);

  useEffect(() => {
    if (!busquedaProducto) {
      setResultadosProducto([]);
      return;
    }
    window.api.productos.listar({ busqueda: busquedaProducto }).then((r) => r.ok && setResultadosProducto(r.data));
  }, [busquedaProducto]);

  async function crear() {
    setError(null);
    if (!form.cliente_id || !productoSeleccionado || !form.texto_grabado.trim()) {
      setError("Cliente, producto y texto a grabar son obligatorios");
      return;
    }
    const res = await window.api.grabados.crear({
      cliente_id: form.cliente_id,
      producto_id: productoSeleccionado.id,
      venta_id: null,
      texto_grabado: form.texto_grabado,
      tipo_fuente: form.tipo_fuente || null,
      posicion: form.posicion || null,
      imagen_referencia_path: null,
      fecha_entrega_estimada: form.fecha_entrega_estimada || null,
      responsable_id: null,
      costo_adicional_centavos: form.costo_adicional_centavos,
      notas: form.notas || null,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setForm(FORM_VACIO);
    setProductoSeleccionado(null);
    setShowForm(false);
    cargar();
  }

  async function avanzarEstado(orden: any, nuevoEstado: EstadoGrabado) {
    const res = await window.api.grabados.cambiarEstado(orden.id, nuevoEstado);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    cargar();
  }

  async function notificarWhatsApp(orden: any) {
    const mensaje = `Hola ${orden.cliente_nombre}, tu pedido de grabado personalizado (${orden.marca} ${orden.modelo}) ya está listo para recoger en La Lapicería. ¡Te esperamos!`;
    await window.api.sistema.abrirWhatsApp(orden.cliente_telefono ?? "", mensaje);
  }

  const NEXT: Record<EstadoGrabado, EstadoGrabado | null> = {
    recibido: "en_proceso",
    en_proceso: "control_calidad",
    control_calidad: "listo",
    listo: "entregado",
    entregado: null,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Grabados personalizados</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
        >
          {showForm ? "Cancelar" : "+ Nueva orden"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-3 gap-3">
          {error && <div className="col-span-3 text-red-600 text-sm">{error}</div>}

          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Cliente
            <select
              className="input"
              value={form.cliente_id}
              onChange={(e) => setForm({ ...form, cliente_id: e.target.value === "" ? "" : Number(e.target.value) })}
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="text-xs text-gray-500 flex flex-col gap-1 relative">
            <span>Producto</span>
            {productoSeleccionado ? (
              <div className="input flex justify-between items-center">
                <span>
                  {productoSeleccionado.marca} {productoSeleccionado.modelo}
                </span>
                <button className="text-red-500 text-xs" onClick={() => setProductoSeleccionado(null)}>
                  cambiar
                </button>
              </div>
            ) : (
              <input
                className="input"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar producto..."
              />
            )}
            {!productoSeleccionado && resultadosProducto.length > 0 && (
              <div className="absolute top-full z-10 bg-white border border-gray-200 rounded-md shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
                {resultadosProducto.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setProductoSeleccionado(p);
                      setBusquedaProducto("");
                      setResultadosProducto([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50 text-sm"
                  >
                    {p.marca} {p.modelo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Fecha de entrega estimada
            <input
              type="date"
              className="input"
              value={form.fecha_entrega_estimada}
              onChange={(e) => setForm({ ...form, fecha_entrega_estimada: e.target.value })}
            />
          </label>

          <label className="text-xs text-gray-500 flex flex-col gap-1 col-span-2">
            Texto a grabar
            <input
              className="input"
              value={form.texto_grabado}
              onChange={(e) => setForm({ ...form, texto_grabado: e.target.value })}
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Costo adicional (S/)
            <input
              type="number"
              className="input"
              value={form.costo_adicional_centavos / 100}
              onChange={(e) => setForm({ ...form, costo_adicional_centavos: Math.round(Number(e.target.value) * 100) })}
            />
          </label>

          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Tipo de fuente / estilo
            <input
              className="input"
              value={form.tipo_fuente}
              onChange={(e) => setForm({ ...form, tipo_fuente: e.target.value })}
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Posición del grabado
            <input
              className="input"
              value={form.posicion}
              onChange={(e) => setForm({ ...form, posicion: e.target.value })}
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Notas
            <input className="input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </label>

          <div className="col-span-3">
            <button onClick={crear} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Crear orden
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {COLUMNAS.map((col) => {
          const items = ordenes.filter((o) => o.estado === col.estado);
          return (
            <div key={col.estado} className="bg-gray-100 rounded-lg p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                {col.label} ({items.length})
              </div>
              <div className="space-y-2">
                {items.map((o) => {
                  const siguiente = NEXT[o.estado as EstadoGrabado];
                  return (
                    <div key={o.id} className="bg-white rounded-md p-3 shadow-sm text-sm">
                      <div className="font-medium">{o.cliente_nombre}</div>
                      <div className="text-gray-500 text-xs">
                        {o.marca} {o.modelo}
                      </div>
                      <div className="text-xs italic mt-1">"{o.texto_grabado}"</div>
                      {o.costo_adicional_centavos > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          +{formatoSoles(o.costo_adicional_centavos)}
                        </div>
                      )}
                      <div className="flex flex-col gap-1 mt-2">
                        {siguiente && (
                          <button
                            onClick={() => avanzarEstado(o, siguiente)}
                            className="text-brand-600 text-xs font-medium hover:underline text-left"
                          >
                            → {COLUMNAS.find((c) => c.estado === siguiente)?.label}
                          </button>
                        )}
                        {o.estado === "listo" && (
                          <button
                            onClick={() => notificarWhatsApp(o)}
                            className="text-green-600 text-xs font-medium hover:underline text-left"
                          >
                            Avisar por WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className="text-xs text-gray-400 px-2 py-4 text-center">Sin órdenes</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
