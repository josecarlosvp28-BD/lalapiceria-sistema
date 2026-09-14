import { useEffect, useState } from "react";
import { formatoSoles } from "../lib/format";

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(hoy());

  const [resumen, setResumen] = useState<any>(null);
  const [rotacion, setRotacion] = useState<any>(null);
  const [clientesInfo, setClientesInfo] = useState<any>(null);
  const [porCanal, setPorCanal] = useState<any[]>([]);
  const [stockBajo, setStockBajo] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      window.api.dashboard.resumenGeneral(desde, hasta),
      window.api.dashboard.rotacionInventario(desde, hasta),
      window.api.dashboard.clientesNuevosVsRecurrentes(desde, hasta),
      window.api.dashboard.ingresosPorCanal(desde, hasta),
      window.api.productos.stockBajo(),
    ]).then(([r1, r2, r3, r4, r5]) => {
      if (r1.ok) setResumen(r1.data);
      if (r2.ok) setRotacion(r2.data);
      if (r3.ok) setClientesInfo(r3.data);
      if (r4.ok) setPorCanal(r4.data);
      if (r5.ok) setStockBajo(r5.data);
    });
  }, [desde, hasta]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Panel general</h1>
        <div className="flex gap-3 items-end">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Desde
            <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Hasta
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Ingresos del período" value={formatoSoles(resumen?.ingresos_centavos ?? 0)} />
        <Kpi label="N° de ventas" value={String(resumen?.num_ventas ?? 0)} />
        <Kpi label="Ticket promedio" value={formatoSoles(resumen?.ticket_promedio_centavos ?? 0)} />
        <Kpi
          label="Rotación de inventario"
          value={rotacion ? `${rotacion.rotacion}×` : "—"}
          sub="costo vendido / valor de inventario actual"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Clientes nuevos vs. recurrentes</h2>
          {clientesInfo && clientesInfo.total > 0 ? (
            <div>
              <div className="flex h-3 rounded-full overflow-hidden mb-2">
                <div className="bg-brand-500" style={{ width: `${clientesInfo.pct_nuevos}%` }} />
                <div className="bg-brand-200" style={{ width: `${clientesInfo.pct_recurrentes}%` }} />
              </div>
              <div className="text-sm flex justify-between">
                <span>🟣 Nuevos: {clientesInfo.nuevos} ({clientesInfo.pct_nuevos}%)</span>
              </div>
              <div className="text-sm flex justify-between mt-1">
                <span>⚪ Recurrentes: {clientesInfo.recurrentes} ({clientesInfo.pct_recurrentes}%)</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin datos en este período.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Ingresos por canal</h2>
          {porCanal.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos en este período.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {porCanal.map((c: any) => (
                <li key={c.canal} className="flex justify-between">
                  <span className="capitalize">{c.canal} ({c.num_ventas} ventas)</span>
                  <span className="font-medium">{formatoSoles(c.ingresos_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-3">
            El canal "online" queda listo para cuando se conecte la tienda WooCommerce a futuro.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">⚠ Productos con stock bajo</h2>
          {stockBajo.length === 0 ? (
            <p className="text-sm text-gray-400">Todo el inventario está en niveles saludables.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {stockBajo.slice(0, 8).map((p: any) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.marca} {p.modelo}
                  </span>
                  <span className="text-red-600 font-medium">{p.stock_actual}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
