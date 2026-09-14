import { useEffect, useState } from "react";
import type { Cliente } from "../../shared/types";

type EstadoGarantia = "en_revision" | "en_reparacion" | "listo" | "entregado" | "no_procede";

const ESTADOS: { value: EstadoGarantia; label: string }[] = [
  { value: "en_revision", label: "En revisión" },
  { value: "en_reparacion", label: "En reparación" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" },
  { value: "no_procede", label: "No procede" },
];

const FORM_VACIO = {
  cliente_id: "" as number | "",
  marca: "",
  falla: "",
  notas: "",
};

export default function Garantias() {
  const [lista, setLista] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await window.api.garantias.listar();
    if (res.ok) setLista(res.data);
  }

  useEffect(() => {
    cargar();
    window.api.clientes.listar().then((r) => r.ok && setClientes(r.data));
  }, []);

  async function crear() {
    setError(null);
    if (!form.cliente_id || !form.falla.trim()) {
      setError("Cliente y descripción de la falla son obligatorios");
      return;
    }
    const res = await window.api.garantias.crear({
      cliente_id: form.cliente_id,
      producto_id: null,
      venta_id: null,
      marca: form.marca || null,
      falla: form.falla,
      notas: form.notas || null,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setForm(FORM_VACIO);
    setShowForm(false);
    cargar();
  }

  async function cambiarEstado(id: number, estado: EstadoGarantia) {
    const res = await window.api.garantias.cambiarEstado(id, estado);
    if (res.ok) cargar();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Garantías y reparaciones</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
        >
          {showForm ? "Cancelar" : "+ Nueva garantía"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          {error && <div className="col-span-2 text-red-600 text-sm">{error}</div>}
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Cliente
            <select className="input" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value === "" ? "" : Number(e.target.value) })}>
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Marca
            <input className="input" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1 col-span-2">
            Descripción de la falla
            <input className="input" value={form.falla} onChange={(e) => setForm({ ...form, falla: e.target.value })} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1 col-span-2">
            Notas
            <input className="input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </label>
          <div className="col-span-2">
            <button onClick={crear} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Registrar garantía
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Marca</th>
              <th className="px-3 py-2">Falla</th>
              <th className="px-3 py-2">Ingreso</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((g: any) => (
              <tr key={g.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{g.cliente_nombre}</td>
                <td className="px-3 py-2 text-gray-500">{g.marca}</td>
                <td className="px-3 py-2">{g.falla}</td>
                <td className="px-3 py-2 text-gray-500">{g.fecha_ingreso?.slice(0, 10)}</td>
                <td className="px-3 py-2">
                  <select
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-gray-50"
                    value={g.estado}
                    onChange={(e) => cambiarEstado(g.id, e.target.value as EstadoGarantia)}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  No hay garantías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
