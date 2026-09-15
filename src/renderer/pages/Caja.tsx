import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatoSoles } from "../lib/format";

export default function Caja() {
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [montoEsperado, setMontoEsperado] = useState<number | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [montoApertura, setMontoApertura] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const [r1, r2, r3] = await Promise.all([
      api.caja.actual(),
      api.caja.montoEsperado(),
      api.caja.historial(),
    ]);
    if (r1.ok) setCajaActual(r1.data);
    if (r2.ok) setMontoEsperado(r2.data);
    if (r3.ok) setHistorial(r3.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function abrir() {
    setError(null);
    const monto = Math.round(Number(montoApertura) * 100);
    if (Number.isNaN(monto) || monto < 0) {
      setError("Ingresa un monto de apertura válido");
      return;
    }
    const res = await api.caja.abrir(monto, null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMontoApertura("");
    cargar();
  }

  async function cerrar() {
    setError(null);
    const monto = Math.round(Number(montoCierre) * 100);
    if (Number.isNaN(monto) || monto < 0) {
      setError("Ingresa el monto contado en caja");
      return;
    }
    const res = await api.caja.cerrar(monto, null, notasCierre || null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMontoCierre("");
    setNotasCierre("");
    cargar();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Caja diaria</h1>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      {!cajaActual ? (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Abrir caja</h2>
          <label className="text-xs text-gray-500 flex flex-col gap-1 mb-3 max-w-xs">
            Monto de apertura (S/)
            <input type="number" className="input" value={montoApertura} onChange={(e) => setMontoApertura(e.target.value)} />
          </label>
          <button onClick={abrir} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600">
            Abrir caja
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold mb-1">Caja abierta</h2>
          <p className="text-xs text-gray-500 mb-4">
            Apertura: {formatoSoles(cajaActual.monto_apertura_centavos)} — desde {cajaActual.created_at}
          </p>
          <div className="bg-gray-50 rounded-md p-3 mb-4 text-sm">
            Monto esperado en caja ahora mismo (apertura + ventas en efectivo):{" "}
            <span className="font-semibold">{montoEsperado !== null ? formatoSoles(montoEsperado) : "—"}</span>
          </div>
          <label className="text-xs text-gray-500 flex flex-col gap-1 mb-3 max-w-xs">
            Monto contado al cerrar (S/)
            <input type="number" className="input" value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1 mb-3">
            Notas (opcional)
            <input className="input" value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} />
          </label>
          <button onClick={cerrar} className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600">
            Cerrar caja
          </button>
        </div>
      )}

      <h2 className="font-semibold mt-8 mb-3">Historial de cierres</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Apertura</th>
              <th className="px-3 py-2 text-right">Esperado</th>
              <th className="px-3 py-2 text-right">Real</th>
              <th className="px-3 py-2 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {historial
              .filter((c: any) => c.estado === "cerrada")
              .map((c: any) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{c.fecha?.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right">{formatoSoles(c.monto_apertura_centavos)}</td>
                  <td className="px-3 py-2 text-right">{formatoSoles(c.monto_cierre_esperado_centavos)}</td>
                  <td className="px-3 py-2 text-right">{formatoSoles(c.monto_cierre_real_centavos)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${c.diferencia_centavos === 0 ? "" : c.diferencia_centavos > 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatoSoles(c.diferencia_centavos)}
                  </td>
                </tr>
              ))}
            {historial.filter((c: any) => c.estado === "cerrada").length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  Sin cierres registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
