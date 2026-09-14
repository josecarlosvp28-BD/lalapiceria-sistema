import { useEffect, useState } from "react";
import type { Cliente, Producto } from "../../shared/types";
import { formatoSoles } from "../lib/format";

type EstadoCotizacion = "cotizacion" | "aprobacion" | "produccion" | "entrega";

const ESTADOS: { value: EstadoCotizacion; label: string }[] = [
  { value: "cotizacion", label: "Cotización" },
  { value: "aprobacion", label: "Aprobación" },
  { value: "produccion", label: "Producción" },
  { value: "entrega", label: "Entrega" },
];

const SIGUIENTE: Record<EstadoCotizacion, EstadoCotizacion | null> = {
  cotizacion: "aprobacion",
  aprobacion: "produccion",
  produccion: "entrega",
  entrega: null,
};

interface ItemForm {
  producto: Producto;
  cantidad: number;
  precio_unitario_centavos: number;
}

export default function Cotizaciones() {
  const [lista, setLista] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await window.api.cotizaciones.listar();
    if (res.ok) setLista(res.data);
  }

  useEffect(() => {
    cargar();
    window.api.clientes.listar().then((r) => r.ok && setClientes(r.data));
  }, []);

  useEffect(() => {
    if (!busquedaProducto) {
      setResultados([]);
      return;
    }
    window.api.productos.listar({ busqueda: busquedaProducto }).then((r) => r.ok && setResultados(r.data));
  }, [busquedaProducto]);

  function agregarItem(p: Producto) {
    setItems((prev) => [...prev, { producto: p, cantidad: 1, precio_unitario_centavos: p.precio_centavos }]);
    setBusquedaProducto("");
    setResultados([]);
  }

  function actualizarItem(i: number, campo: "cantidad" | "precio_unitario_centavos", valor: number) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }

  function quitarItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario_centavos, 0);

  async function crear() {
    setError(null);
    if (!clienteId || items.length === 0) {
      setError("Selecciona un cliente y agrega al menos un producto");
      return;
    }
    const res = await window.api.cotizaciones.crear({
      cliente_id: clienteId,
      descripcion: descripcion || null,
      fecha_entrega_estimada: fechaEntrega || null,
      notas: null,
      items: items.map((it) => ({
        producto_id: it.producto.id,
        cantidad: it.cantidad,
        precio_unitario_centavos: it.precio_unitario_centavos,
      })),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setShowForm(false);
    setClienteId("");
    setDescripcion("");
    setFechaEntrega("");
    setItems([]);
    cargar();
  }

  async function avanzar(cot: any) {
    const siguiente = SIGUIENTE[cot.estado as EstadoCotizacion];
    if (!siguiente) return;
    const res = await window.api.cotizaciones.cambiarEstado(cot.id, siguiente);
    if (res.ok) cargar();
  }

  async function generarPDF(cot: any) {
    setError(null);
    const res = await window.api.cotizaciones.generarPDF(cot.id);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Cotizaciones corporativas</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
        >
          {showForm ? "Cancelar" : "+ Nueva cotización"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Cliente corporativo
              <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Descripción
              <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: regalos corporativos fin de año" />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Fecha de entrega estimada
              <input type="date" className="input" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
            </label>
          </div>

          <div className="relative mb-3">
            <input
              className="input"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              placeholder="Buscar producto para agregar..."
            />
            {resultados.length > 0 && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      agregarItem(p);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50 text-sm"
                  >
                    {p.marca} {p.modelo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <table className="w-full text-sm mb-3">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-1">Producto</th>
                <th className="pb-1 text-right">Cant.</th>
                <th className="pb-1 text-right">Precio unit.</th>
                <th className="pb-1 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5">
                    {it.producto.marca} {it.producto.modelo}
                  </td>
                  <td className="py-1.5 text-right">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded px-1 py-0.5 text-right"
                      value={it.cantidad}
                      onChange={(e) => actualizarItem(i, "cantidad", Number(e.target.value))}
                    />
                  </td>
                  <td className="py-1.5 text-right">
                    <input
                      type="number"
                      className="w-20 border border-gray-300 rounded px-1 py-0.5 text-right"
                      value={it.precio_unitario_centavos / 100}
                      onChange={(e) => actualizarItem(i, "precio_unitario_centavos", Math.round(Number(e.target.value) * 100))}
                    />
                  </td>
                  <td className="py-1.5 text-right font-medium">{formatoSoles(it.cantidad * it.precio_unitario_centavos)}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => quitarItem(i)} className="text-red-500 text-xs">
                      quitar
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    Agrega productos a la cotización
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center">
            <div className="font-semibold">Total: {formatoSoles(total)}</div>
            <button onClick={crear} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Crear cotización
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c: any) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{c.cliente_nombre}</td>
                <td className="px-3 py-2 text-gray-500">{c.descripcion}</td>
                <td className="px-3 py-2 text-right font-medium">{formatoSoles(c.total_centavos)}</td>
                <td className="px-3 py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                    {ESTADOS.find((e) => e.value === c.estado)?.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-right space-x-3">
                  <button onClick={() => generarPDF(c)} className="text-gray-600 text-xs font-medium hover:underline">
                    Generar PDF
                  </button>
                  {SIGUIENTE[c.estado as EstadoCotizacion] && (
                    <button onClick={() => avanzar(c)} className="text-brand-600 text-xs font-medium hover:underline">
                      Avanzar → {ESTADOS.find((e) => e.value === SIGUIENTE[c.estado as EstadoCotizacion])?.label}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  No hay cotizaciones todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
