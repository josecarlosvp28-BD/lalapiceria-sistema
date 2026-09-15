import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, obtenerSesion } from "./lib/api";

interface Usuario {
  id: number;
  nombre: string;
  email: string | null;
  rol: string;
}

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarSesion() {
    const res = await obtenerSesion();
    setUsuario(res.ok ? res.data : null);
    setCargando(false);
  }

  useEffect(() => {
    cargarSesion();
    const onExpirada = () => setUsuario(null);
    window.addEventListener("sesion-expirada", onExpirada);
    return () => window.removeEventListener("sesion-expirada", onExpirada);
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    const res = await apiLogin(email, password);
    if (!res.ok) return res.error;
    setUsuario(res.data);
    return null;
  }

  async function logout() {
    await apiLogout();
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, cargando, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
