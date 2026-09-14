import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import Inventario from "./pages/Inventario";
import POS from "./pages/POS";
import Clientes from "./pages/Clientes";

const nav = [
  { to: "/pos", label: "Punto de Venta" },
  { to: "/inventario", label: "Inventario" },
  { to: "/clientes", label: "Clientes" },
];

export default function App() {
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
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/clientes" element={<Clientes />} />
        </Routes>
      </main>
    </div>
  );
}
