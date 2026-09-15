import bcrypt from "bcryptjs";
import { getDb } from "../../db";
import type { Rol, Usuario } from "../../shared/types";

export class AuthError extends Error {}

export function verificarCredenciales(email: string, password: string): Usuario {
  const db = getDb();
  const usuario = db
    .prepare("SELECT * FROM usuarios WHERE email = ? AND activo = 1")
    .get(email) as (Usuario & { pin_hash: string }) | undefined;

  if (!usuario) throw new AuthError("Correo o contraseña incorrectos");
  if (!bcrypt.compareSync(password, usuario.pin_hash)) {
    throw new AuthError("Correo o contraseña incorrectos");
  }

  const { pin_hash, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword as Usuario;
}

export function obtenerUsuario(id: number): Usuario | undefined {
  const db = getDb();
  const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) as
    | (Usuario & { pin_hash: string })
    | undefined;
  if (!usuario) return undefined;
  const { pin_hash, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword as Usuario;
}

export function listarUsuarios(): Usuario[] {
  return getDb()
    .prepare("SELECT id, nombre, email, rol, activo, created_at, updated_at FROM usuarios ORDER BY nombre")
    .all() as Usuario[];
}

export function crearUsuario(input: { nombre: string; email: string; password: string; rol: Rol }): Usuario {
  const db = getDb();
  const existente = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(input.email);
  if (existente) throw new AuthError("Ya existe un usuario con ese correo");

  const hash = bcrypt.hashSync(input.password, 10);
  const info = db
    .prepare("INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, ?, ?, 1)")
    .run(input.nombre, input.email, input.rol, hash);
  return obtenerUsuario(Number(info.lastInsertRowid))!;
}

export function cambiarEstadoUsuario(id: number, activo: boolean): Usuario {
  const db = getDb();
  db.prepare("UPDATE usuarios SET activo = ?, updated_at = datetime('now') WHERE id = ?").run(activo ? 1 : 0, id);
  return obtenerUsuario(id)!;
}
