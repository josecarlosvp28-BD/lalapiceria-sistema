import { useEffect, useState } from "react";
import type { Cliente, NuevoCliente } from "../../shared/types";
import { formatoSoles } from "../lib/format";

const CLIENTE_VACIO: NuevoCliente = {
  nombre: "",
  dni_ruc: "",
  telefono: "",
  email: "",
  direccion: "",
  fecha_nacimiento: "",
  tipo_cliente: "retail",
  marca_favorita: "",
  presupuesto_rango: "",
  notas: "",
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NuevoCliente>(CLIENTE_VACIO);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cumpleanos, setCumpleanos] = useState<Cliente[]>([]);
  const [seguimiento, setSeguimiento] = useState<any[]>([]);

  async function cargar() {
    const res = await window.api.clientes.listar(busqueda);
    if (res.ok) setClientes(res.data);
  }

  useEffect(() => {
    cargar();
  }, [busqueda]);

  useEffect(() => {
    window.api.clientes.proximosCumpleanos(30).then((r) => r.ok && setCumpleanos(r.data));
    window.api.clientes.paraSeguimiento(90).then((r) => r.ok && setSeguimiento(r.data));
  }, []);

  async function guardar() {
    if (!form.nombre.trim()) return;
    const res = await window.api.clientes.crear(form);
    if (res.ok) {
      setShowForm(false);
      setForm(CLIENTE_VACIO);
      cargar();
    }
  }

  async function verHistorial(c: Cliente) {
    setSeleccionado(c);
    const res = await window.api.clientes.historialCompras(c.id);
    if (res.ok) setHistorial(res.data);
  }

  return (
    <div className="p-6 grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600"
          >
            {showForm ? "Cancelar" : "+ Nuevo cliente"}
          </button>
        </div>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, DNI/RUC o teléfono..."
          className="input mb-4"
        />

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
            <input className="input" placeholder="Nombre completo / Razón social" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className="input" placeholder="DNI / RUC" value={form.dni_ruc ?? ""} onChange={(e) => setForm({ ...form, dni_ruc: e.target.value })} />
            <input className="input" placeholder="Teléfono" value={form.telefono ?? ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="Dirección" value={form.direccion ?? ""} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            <select className="input" value={form.tipo_cliente} onChange={(e) => setForm({ ...form, tipo_cliente: e.target.value as any })}>
              <option value="retail">Retail</option>
              <option value="mayorista">Mayorista</option>
              <option value="corporativo">Corporativo</option>
            </select>
            <input className="input" placeholder="Marca favorita" value={form.marca_favorita ?? ""} onChange={(e) => setForm({ ...form, marca_favorita: e.target.value })} />
            <input type="date" className="input" value={form.fecha_nacimiento ?? ""} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            <div className="col-span-2">
              <button onClick={guardar} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                Guardar cliente
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{c.nombre}</td>
                  <td className="px-3 py-2 text-gray-500">{c.tipo_cliente}</td>
                  <td className="px-3 py-2">{c.telefono}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => verHistorial(c)} className="text-brand-600 text-xs font-medium hover:underline">
                      Ver historial
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                    No hay clientes todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-sm mb-2">🎂 Cumpleaños próximos (30 días)</h2>
        {cumpleanos.length === 0 ? (
          <p className="text-xs text-gray-400">Sin cumpleaños próximos.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {cumpleanos.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.nombre}</span>
                <span className="text-gray-400 text-xs">{c.fecha_nacimiento?.slice(5, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-sm mb-2">📞 Seguimiento post-venta (90+ días sin comprar)</h2>
        {seguimiento.length === 0 ? (
          <p className="text-xs text-gray-400">Todos tus clientes han comprado recientemente.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {seguimiento.slice(0, 8).map((c: any) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.nombre}</span>
                <span className="text-gray-400 text-xs">última: {c.ultima_compra?.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit">
        {!seleccionado ? (
          <p className="text-gray-400 text-sm">Selecciona un cliente para ver su historial de compras.</p>
        ) : (
          <div>
            <h2 className="font-semibold mb-1">{seleccionado.nombre}</h2>
            <p className="text-xs text-gray-500 mb-3">{seleccionado.telefono} · {seleccionado.email}</p>
            <div className="space-y-2">
              {historial.length === 0 && <p className="text-sm text-gray-400">Sin compras registradas.</p>}
              {historial.map((v: any) => (
                <div key={v.id} className="border-t border-gray-100 pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{v.fecha?.slice(0, 10)}</span>
                    <span className="font-medium">{formatoSoles(v.total_centavos)}</span>
                  </div>
                  <div className="text-xs text-gray-400">{v.productos}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
