import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Producto, NuevoProducto } from "../../shared/types";
import { formatoSoles } from "../lib/format";

const CATEGORIAS = ["lapicero", "pluma_fuente", "roller", "portaminas", "accesorio", "estuche"] as const;

const PRODUCTO_VACIO: NuevoProducto = {
  sku: "",
  marca: "",
  modelo: "",
  categoria: "lapicero",
  variante_color: "",
  variante_acabado: "",
  variante_punta: null,
  costo_centavos: 0,
  precio_centavos: 0,
  proveedor_id: null,
  stock_minimo: 1,
  ubicacion: "vitrina",
  estado: "activo",
};

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NuevoProducto>(PRODUCTO_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [ajuste, setAjuste] = useState<{ producto: Producto; cantidad: string; motivo: string } | null>(null);

  async function cargar() {
    const res = await api.productos.listar({ busqueda });
    if (res.ok) setProductos(res.data);
  }

  useEffect(() => {
    cargar();
  }, [busqueda]);

  const stockBajoCount = useMemo(
    () => productos.filter((p) => p.stock_actual <= p.stock_minimo).length,
    [productos]
  );

  async function guardar() {
    setError(null);
    if (!form.sku || !form.marca || !form.modelo) {
      setError("SKU, marca y modelo son obligatorios");
      return;
    }
    const res = await api.productos.crear(form);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setShowForm(false);
    setForm(PRODUCTO_VACIO);
    cargar();
  }

async function confirmarAjuste() {
    if (!ajuste) return;
    const cantidad = Number(ajuste.cantidad);
    if (Number.isNaN(cantidad) || cantidad === 0) {
      setError("Ingresa una cantidad válida (usa negativo para restar)");
      return;
    }
    const res = await api.inventario.registrarMovimiento({
      producto_id: ajuste.producto.id,
      tipo: cantidad > 0 ? "entrada" : "ajuste",
      cantidad: Math.abs(cantidad),
      motivo: ajuste.motivo || null,
      referencia_tipo: "ajuste_manual",
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAjuste(null);
    setError(null);
    cargar();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          {stockBajoCount > 0 && (
            <p className="text-sm text-amber-700 mt-1">
              ⚠ {stockBajoCount} producto(s) con stock bajo o agotado
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
        >
          {showForm ? "Cancelar" : "+ Nuevo producto"}
        </button>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por SKU, marca o modelo..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm"
      />

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-3 gap-3">
          {error && <div className="col-span-3 text-red-600 text-sm">{error}</div>}
          <Field label="SKU">
            <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Marca">
            <input className="input" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
          </Field>
          <Field label="Modelo / Línea">
            <input className="input" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <select
              className="input"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as any })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Color">
            <input
              className="input"
              value={form.variante_color ?? ""}
              onChange={(e) => setForm({ ...form, variante_color: e.target.value })}
            />
          </Field>
          <Field label="Acabado">
            <input
              className="input"
              value={form.variante_acabado ?? ""}
              onChange={(e) => setForm({ ...form, variante_acabado: e.target.value })}
            />
          </Field>
          <Field label="Costo (S/)">
            <input
              type="number"
              className="input"
              value={form.costo_centavos / 100}
              onChange={(e) => setForm({ ...form, costo_centavos: Math.round(Number(e.target.value) * 100) })}
            />
          </Field>
          <Field label="Precio venta (S/)">
            <input
              type="number"
              className="input"
              value={form.precio_centavos / 100}
              onChange={(e) => setForm({ ...form, precio_centavos: Math.round(Number(e.target.value) * 100) })}
            />
          </Field>
          <Field label="Stock mínimo">
            <input
              type="number"
              className="input"
              value={form.stock_minimo}
              onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
            />
          </Field>
          <div className="col-span-3">
            <button onClick={guardar} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Guardar producto
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Marca / Modelo</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2 text-right">Costo</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Margen</th>
              <th className="px-3 py-2 text-right">Stock</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const margen =
                p.precio_centavos === 0 ? 0 : ((p.precio_centavos - p.costo_centavos) / p.precio_centavos) * 100;
              const bajo = p.stock_actual <= p.stock_minimo;
              return (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2">
                    {p.marca} {p.modelo}
                    {p.variante_color && <span className="text-gray-400"> · {p.variante_color}</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{p.categoria}</td>
                  <td className="px-3 py-2 text-right">{formatoSoles(p.costo_centavos)}</td>
                  <td className="px-3 py-2 text-right">{formatoSoles(p.precio_centavos)}</td>
                  <td className="px-3 py-2 text-right">{margen.toFixed(0)}%</td>
                  <td className={`px-3 py-2 text-right font-medium ${bajo ? "text-red-600" : ""}`}>
                    {p.stock_actual}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{p.estado}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setAjuste({ producto: p, cantidad: "", motivo: "" });
                        setError(null);
                      }}
                      className="text-brand-600 text-xs font-medium hover:underline"
                    >
                      Ajustar stock
                    </button>
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                  No hay productos todavía. Crea el primero con "+ Nuevo producto".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ajuste && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-5 w-96 shadow-xl">
            <h3 className="font-semibold mb-1">Ajustar stock</h3>
            <p className="text-sm text-gray-500 mb-3">
              {ajuste.producto.marca} {ajuste.producto.modelo} — stock actual: {ajuste.producto.stock_actual}
            </p>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <label className="text-xs text-gray-500 flex flex-col gap-1 mb-2">
              Cantidad a agregar (usa negativo para restar, ej: -2)
              <input
                type="number"
                autoFocus
                className="input"
                value={ajuste.cantidad}
                onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })}
              />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1 mb-4">
              Motivo
              <input
                className="input"
                value={ajuste.motivo}
                onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })}
                placeholder="Ej: conteo físico, producto dañado, compra..."
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setAjuste(null);
                  setError(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAjuste}
                className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-gray-500 flex flex-col gap-1">
      {label}
      {children}
    </label>
  );
}
