import express from "express";
import session from "express-session";
import path from "node:path";
import { handlers } from "./handlers";
import { verificarCredenciales, obtenerUsuario, AuthError } from "./repositories/usuarios";
import { generarCotizacionPDF } from "./pdf";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function createApp() {
  const app = express();
  app.use(express.json());

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET debe estar definido en producción");
  }

  app.use(
    session({
      name: "lalapiceria.sid",
      secret: sessionSecret ?? "dev-secret-cambiar-en-produccion",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
      },
    })
  );

  // --- Autenticación ---
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Correo y contraseña son obligatorios" });
    }
    try {
      const usuario = verificarCredenciales(email, password);
      req.session.userId = usuario.id;
      res.json({ ok: true, data: usuario });
    } catch (err) {
      if (err instanceof AuthError) {
        return res.status(401).json({ ok: false, error: err.message });
      }
      throw err;
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true, data: null }));
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.userId) return res.json({ ok: true, data: null });
    const usuario = obtenerUsuario(req.session.userId);
    res.json({ ok: true, data: usuario ?? null });
  });

  // --- Middleware: todo lo demás bajo /api requiere sesión activa ---
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth/")) return next();
    if (!req.session.userId) return res.status(401).json({ ok: false, error: "Sesión no iniciada" });
    next();
  });

  // --- RPC genérico: reutiliza los mismos handlers que antes usaba Electron IPC ---
  app.post("/api/rpc", async (req, res) => {
    const { channel, args } = req.body ?? {};
    const handler = handlers[channel];
    if (!handler) {
      return res.status(404).json({ ok: false, error: `Canal desconocido: ${channel}` });
    }
    try {
      const data = await handler(...(args ?? []));
      res.json({ ok: true, data });
    } catch (err) {
      res.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- PDF de cotización ---
  app.get("/api/cotizaciones/:id/pdf", async (req, res) => {
    try {
      const buffer = await generarCotizacionPDF(Number(req.params.id));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="cotizacion-${req.params.id}.pdf"`);
      res.send(buffer);
    } catch (err) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Sirve el frontend compilado (producción) ---
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });

  return app;
}
