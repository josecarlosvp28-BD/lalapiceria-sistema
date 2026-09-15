import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import Inventario from "./pages/Inventario";
import POS from "./pages/POS";
import Clientes from "./pages/Clientes";
import Grabados from "./pages/Grabados";
import Reportes from "./pages/Reportes";
import Cotizaciones from "./pages/Cotizaciones";
import Garantias from "./pages/Garantias";
import Caja from "./pages/Caja";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useAuth } from "./auth";

const nav = [
  { to: "/dashboard", label: "Panel general" },
  { to: "/pos", label: "Punto de Venta" },
  { to: "/inventario", label: "Inventario" },
  { to: "/clientes", label: "Clientes" },
  { to: "/grabados", label: "Grabados" },
  { to: "/cotizaciones", label: "Cotizaciones" },
  { to: "/garantias", label: "Garantías" },
  { to: "/caja", label: "Caja diaria" },
  { to: "/reportes", label: "Reportes" },
];

export default function App() {
  const { usuario, cargando, logout } = useAuth();

  if (cargando) {
    return <div className="h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-brand-800 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="font-semibold text-lg leading-tight">La Lapicería</div>
          <div className="text-xs text-brand-200">Sistema de Gestión</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-brand-100 hover:bg-brand-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/10 text-sm">
          <div className="text-brand-100">{usuario.nombre}</div>
          <button onClick={logout} className="text-brand-300 text-xs hover:underline mt-1">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/grabados" element={<Grabados />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/garantias" element={<Garantias />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
      </main>
    </div>
  );
}
