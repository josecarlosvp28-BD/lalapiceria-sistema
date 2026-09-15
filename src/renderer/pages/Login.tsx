import { useState } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const err = await login(email, password);
    setEnviando(false);
    if (err) setError(err);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-brand-800">
      <form onSubmit={enviar} className="bg-white rounded-lg shadow-xl p-8 w-96">
        <h1 className="text-xl font-semibold text-brand-800 mb-1">La Lapicería</h1>
        <p className="text-sm text-gray-500 mb-6">Sistema de Gestión</p>

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        <label className="text-xs text-gray-500 flex flex-col gap-1 mb-3">
          Correo electrónico
          <input
            type="email"
            required
            autoFocus
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1 mb-5">
          Contraseña
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-brand-500 text-white py-2.5 rounded-md font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
