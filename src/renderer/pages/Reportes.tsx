import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatoSoles } from "../lib/format";

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function Reportes() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(hoy());
  const [agrupacion, setAgrupacion] = useState<"day" | "month" | "year">("day");

  const [masVendidos, setMasVendidos] = useState<any[]>([]);
  const [porPeriodo, setPorPeriodo] = useState<any[]>([]);
  const [porMarca, setPorMarca] = useState<any[]>([]);
  const [porCategoria, setPorCategoria] = useState<any[]>([]);
  const [comparativo, setComparativo] = useState<any | null>(null);

  async function cargar() {
    const [r1, r2, r3, r4] = await Promise.all([
      api.ventas.reporteMasVendidos(desde, hasta),
      api.ventas.reportePorPeriodo(desde, hasta, agrupacion),
      api.ventas.reportePorMarca(desde, hasta),
      api.ventas.reportePorCategoria(desde, hasta),
    ]);
    if (r1.ok) setMasVendidos(r1.data);
    if (r2.ok) setPorPeriodo(r2.data);
    if (r3.ok) setPorMarca(r3.data);
    if (r4.ok) setPorCategoria(r4.data);

    // Periodo anterior de igual duración, para comparación
    const dDesde = new Date(desde);
    const dHasta = new Date(hasta);
    const dias = Math.max(1, Math.round((dHasta.getTime() - dDesde.getTime()) / 86400000));
    const hastaAnterior = new Date(dDesde);
    hastaAnterior.setDate(hastaAnterior.getDate() - 1);
    const desdeAnterior = new Date(hastaAnterior);
    desdeAnterior.setDate(desdeAnterior.getDate() - dias);

    const r5 = await api.ventas.resumenComparativo(
      desde,
      hasta,
      desdeAnterior.toISOString().slice(0, 10),
      hastaAnterior.toISOString().slice(0, 10)
    );
    if (r5.ok) setComparativo(r5.data);
  }

  useEffect(() => {
    cargar();
  }, [desde, hasta, agrupacion]);

  const totalPeriodoActual = comparativo?.actual?.total_centavos ?? 0;
  const totalPeriodoAnterior = comparativo?.anterior?.total_centavos ?? 0;
  const variacion =
    totalPeriodoAnterior === 0 ? null : ((totalPeriodoActual - totalPeriodoAnterior) / totalPeriodoAnterior) * 100;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reportes de ventas</h1>

      <div className="flex gap-3 items-end mb-6">
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Desde
          <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Hasta
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Agrupar por
          <select className="input" value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as any)}>
            <option value="day">Día</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi
          label="Ventas del período"
          value={formatoSoles(totalPeriodoActual)}
          sub={variacion !== null ? `${variacion >= 0 ? "▲" : "▼"} ${Math.abs(variacion).toFixed(1)}% vs. período anterior` : undefined}
          positive={variacion !== null ? variacion >= 0 : undefined}
        />
        <Kpi label="N° de ventas" value={String(comparativo?.actual?.num_ventas ?? 0)} />
        <Kpi
          label="Ticket promedio"
          value={formatoSoles(comparativo?.actual?.ticket_promedio_centavos ?? 0)}
        />
        <Kpi label="Período anterior" value={formatoSoles(totalPeriodoAnterior)} sub="mismo rango de días" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-sm">Ventas por período</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2">Período</th>
                <th className="pb-2 text-right">Ventas</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {porPeriodo.map((r: any) => (
                <tr key={r.periodo} className="border-t border-gray-100">
                  <td className="py-1.5">{r.periodo}</td>
                  <td className="py-1.5 text-right">{r.num_ventas}</td>
                  <td className="py-1.5 text-right font-medium">{formatoSoles(r.total_centavos)}</td>
                </tr>
              ))}
              {porPeriodo.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    Sin datos en este rango
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-sm">Productos más vendidos</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-right">Unidades</th>
                <th className="pb-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {masVendidos.slice(0, 10).map((r: any) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-1.5">
                    {r.marca} {r.modelo}
                  </td>
                  <td className="py-1.5 text-right">{r.unidades}</td>
                  <td className="py-1.5 text-right font-medium">{formatoSoles(r.ingresos_centavos)}</td>
                </tr>
              ))}
              {masVendidos.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    Sin datos en este rango
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-sm">Ventas por marca</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2">Marca</th>
                <th className="pb-2 text-right">Unidades</th>
                <th className="pb-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {porMarca.map((r: any) => (
                <tr key={r.marca} className="border-t border-gray-100">
                  <td className="py-1.5">{r.marca}</td>
                  <td className="py-1.5 text-right">{r.unidades}</td>
                  <td className="py-1.5 text-right font-medium">{formatoSoles(r.ingresos_centavos)}</td>
                </tr>
              ))}
              {porMarca.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    Sin datos en este rango
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-sm">Ventas por categoría</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2">Categoría</th>
                <th className="pb-2 text-right">Unidades</th>
                <th className="pb-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((r: any) => (
                <tr key={r.categoria} className="border-t border-gray-100">
                  <td className="py-1.5">{r.categoria}</td>
                  <td className="py-1.5 text-right">{r.unidades}</td>
                  <td className="py-1.5 text-right font-medium">{formatoSoles(r.ingresos_centavos)}</td>
                </tr>
              ))}
              {porCategoria.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    Sin datos en este rango
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && (
        <div className={`text-xs mt-1 ${positive === undefined ? "text-gray-400" : positive ? "text-green-600" : "text-red-600"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
