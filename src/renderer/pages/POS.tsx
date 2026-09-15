import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Cliente, Producto, VentaItem, VentaPago, MetodoPago } from "../../shared/types";
import { formatoSoles } from "../lib/format";

interface Carrito {
  producto: Producto;
  cantidad: number;
}

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "yape_plin", label: "Yape / Plin" },
];

export default function POS() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Carrito[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [descuento, setDescuento] = useState(0);
  const [descuentoMotivo, setDescuentoMotivo] = useState("");
  const [pagos, setPagos] = useState<VentaPago[]>([{ metodo: "efectivo", monto_centavos: 0 }]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    api.clientes.listar().then((r) => r.ok && setClientes(r.data));
  }, []);

  useEffect(() => {
    if (!busqueda) {
      setResultados([]);
      return;
    }
    api.productos.listar({ busqueda }).then((r) => r.ok && setResultados(r.data));
  }, [busqueda]);

  function agregarProducto(p: Producto) {
    setCarrito((prev) => {
      const existente = prev.find((c) => c.producto.id === p.id);
      if (existente) {
        return prev.map((c) => (c.producto.id === p.id ? { ...c, cantidad: c.cantidad + 1 } : c));
      }
      return [...prev, { producto: p, cantidad: 1 }];
    });
    setBusqueda("");
    setResultados([]);
  }

  function cambiarCantidad(producto_id: number, cantidad: number) {
    setCarrito((prev) =>
      prev
        .map((c) => (c.producto.id === producto_id ? { ...c, cantidad } : c))
        .filter((c) => c.cantidad > 0)
    );
  }

  const subtotal = useMemo(
    () => carrito.reduce((acc, c) => acc + c.producto.precio_centavos * c.cantidad, 0),
    [carrito]
  );
  const total = Math.max(0, subtotal - descuento);
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto_centavos, 0);

  function actualizarPago(i: number, campo: keyof VentaPago, valor: any) {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  function agregarPago() {
    setPagos((prev) => [...prev, { metodo: "efectivo", monto_centavos: 0 }]);
  }

  async function cobrar() {
    setMensaje(null);
    if (carrito.length === 0) {
      setMensaje("Agrega al menos un producto");
      return;
    }
    if (descuento > 0 && !descuentoMotivo.trim()) {
      setMensaje("Indica el motivo del descuento");
      return;
    }
    if (totalPagado !== total) {
      setMensaje(`Los pagos (${formatoSoles(totalPagado)}) deben sumar exactamente el total (${formatoSoles(total)})`);
      return;
    }

    const items: VentaItem[] = carrito.map((c) => ({
      producto_id: c.producto.id,
      cantidad: c.cantidad,
      precio_unitario_centavos: c.producto.precio_centavos,
      descuento_centavos: 0,
    }));

    const res = await api.ventas.crear({
      cliente_id: clienteId === "" ? null : clienteId,
      usuario_id: null,
      items,
      descuento_centavos: descuento,
      descuento_motivo: descuento > 0 ? descuentoMotivo : null,
      pagos,
    });

    if (!res.ok) {
      setMensaje(res.error);
      return;
    }

    setCarrito([]);
    setDescuento(0);
    setDescuentoMotivo("");
    setPagos([{ metodo: "efectivo", monto_centavos: 0 }]);
    setClienteId("");
    setMensaje(`✓ Venta #${res.data.id} registrada — ${formatoSoles(res.data.total_centavos)}`);
  }

  return (
    <div className="p-6 grid grid-cols-3 gap-6 h-full">
      <div className="col-span-2 flex flex-col">
        <h1 className="text-2xl font-semibold mb-4">Punto de Venta</h1>

        <div className="relative mb-4">
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por SKU, marca o modelo..."
            className="input"
          />
          {resultados.length > 0 && (
            <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg w-full mt-1 max-h-64 overflow-y-auto">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-50 text-sm flex justify-between"
                  disabled={p.stock_actual === 0}
                >
                  <span>
                    {p.marca} {p.modelo} {p.variante_color && `· ${p.variante_color}`}{" "}
                    <span className="text-gray-400 text-xs">({p.sku})</span>
                  </span>
                  <span className="flex gap-3">
                    <span className="text-gray-400 text-xs">stock: {p.stock_actual}</span>
                    <span className="font-medium">{formatoSoles(p.precio_centavos)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600 sticky top-0">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-center">Cant.</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((c) => (
                <tr key={c.producto.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    {c.producto.marca} {c.producto.modelo}
                  </td>
                  <td className="px-3 py-2 text-right">{formatoSoles(c.producto.precio_centavos)}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={c.producto.stock_actual}
                      value={c.cantidad}
                      onChange={(e) => cambiarCantidad(c.producto.id, Number(e.target.value))}
                      className="w-16 border border-gray-300 rounded px-1 py-0.5 text-center"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatoSoles(c.producto.precio_centavos * c.cantidad)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => cambiarCantidad(c.producto.id, 0)} className="text-red-500 text-xs">
                      quitar
                    </button>
                  </td>
                </tr>
              ))}
              {carrito.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-gray-400">
                    Busca y agrega productos para iniciar la venta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4 h-fit">
        <div>
          <label className="text-xs text-gray-500">Cliente (opcional)</label>
          <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value === "" ? "" : Number(e.target.value))}>
            <option value="">Cliente sin registrar</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatoSoles(subtotal)}</span>
        </div>

        <div>
          <label className="text-xs text-gray-500">Descuento (S/)</label>
          <input
            type="number"
            className="input"
            value={descuento / 100}
            onChange={(e) => setDescuento(Math.round(Number(e.target.value) * 100))}
          />
          {descuento > 0 && (
            <input
              className="input mt-1"
              placeholder="Motivo del descuento (obligatorio)"
              value={descuentoMotivo}
              onChange={(e) => setDescuentoMotivo(e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-between text-lg font-semibold border-t pt-3">
          <span>Total</span>
          <span>{formatoSoles(total)}</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-500">Forma(s) de pago</label>
            <button onClick={agregarPago} className="text-brand-600 text-xs font-medium">
              + dividir pago
            </button>
          </div>
          {pagos.map((pago, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <select
                className="input"
                value={pago.metodo}
                onChange={(e) => actualizarPago(i, "metodo", e.target.value)}
              >
                {METODOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input"
                value={pago.monto_centavos / 100}
                onChange={(e) => actualizarPago(i, "monto_centavos", Math.round(Number(e.target.value) * 100))}
              />
            </div>
          ))}
          <div className={`text-xs mt-1 ${totalPagado === total ? "text-green-600" : "text-gray-400"}`}>
            Pagado: {formatoSoles(totalPagado)} / {formatoSoles(total)}
          </div>
        </div>

        {mensaje && (
          <div className={`text-sm ${mensaje.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{mensaje}</div>
        )}

        <button
          onClick={cobrar}
          className="bg-brand-500 text-white py-2.5 rounded-md font-medium hover:bg-brand-600"
        >
          Cobrar
        </button>
      </div>
    </div>
  );
}
