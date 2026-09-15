import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import type Database from "better-sqlite3";
import { createTestDb } from "./setup";

let testDb: Database.Database;

vi.mock("../../../db", () => ({
  getDb: () => testDb,
}));

const { verificarCredenciales, crearUsuario, AuthError } = await import("../usuarios");

function insertarUsuario(db: Database.Database, email: string, password: string, rol = "admin") {
  const hash = bcrypt.hashSync(password, 4); // costo bajo: los tests no necesitan seguridad real, solo velocidad
  db.prepare("INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, ?, ?, 1)").run(
    "Usuario de prueba",
    email,
    rol,
    hash
  );
}

describe("autenticación", () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  it("permite iniciar sesión con la contraseña correcta", () => {
    insertarUsuario(testDb, "test@lalapiceria.com", "correcta123");
    const usuario = verificarCredenciales("test@lalapiceria.com", "correcta123");
    expect(usuario.email).toBe("test@lalapiceria.com");
  });

  it("rechaza una contraseña incorrecta", () => {
    insertarUsuario(testDb, "test@lalapiceria.com", "correcta123");
    expect(() => verificarCredenciales("test@lalapiceria.com", "incorrecta")).toThrow(AuthError);
  });

  it("rechaza un correo que no existe", () => {
    expect(() => verificarCredenciales("nadie@lalapiceria.com", "cualquiera")).toThrow(AuthError);
  });

  it("rechaza a un usuario desactivado aunque la contraseña sea correcta", () => {
    insertarUsuario(testDb, "inactivo@lalapiceria.com", "correcta123");
    testDb.prepare("UPDATE usuarios SET activo = 0 WHERE email = ?").run("inactivo@lalapiceria.com");
    expect(() => verificarCredenciales("inactivo@lalapiceria.com", "correcta123")).toThrow(AuthError);
  });

  it("nunca devuelve el hash de la contraseña en la respuesta", () => {
    insertarUsuario(testDb, "test@lalapiceria.com", "correcta123");
    const usuario = verificarCredenciales("test@lalapiceria.com", "correcta123");
    expect((usuario as any).pin_hash).toBeUndefined();
  });

  it("no permite crear dos usuarios con el mismo correo", () => {
    crearUsuario({ nombre: "A", email: "dup@lalapiceria.com", password: "x", rol: "vendedor" });
    expect(() =>
      crearUsuario({ nombre: "B", email: "dup@lalapiceria.com", password: "y", rol: "vendedor" })
    ).toThrow(AuthError);
  });
});
