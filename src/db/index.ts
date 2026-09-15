import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { SCHEMA_SQL } from "./schema";

let db: Database.Database | null = null;

export const ADMIN_SEED_EMAIL = "admin@lalapiceria.com";
export const ADMIN_SEED_PASSWORD = "lapiceria2026";

function getDataDir(): string {
  const dir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(getDataDir(), "lalapiceria.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  seedDefaultAdmin(db);
  return db;
}

function seedDefaultAdmin(database: Database.Database) {
  const row = database.prepare("SELECT COUNT(*) as count FROM usuarios").get() as { count: number };
  if (row.count === 0) {
    const hash = bcrypt.hashSync(ADMIN_SEED_PASSWORD, 10);
    database
      .prepare("INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, 'admin', ?, 1)")
      .run("Administrador", ADMIN_SEED_EMAIL, hash);
  }
}

export function backupDatabase(): string {
  const database = getDb();
  const backupsDir = path.join(getDataDir(), "backups");
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupsDir, `lalapiceria-${timestamp}.db`);
  database.backup(backupPath);

  const MAX_BACKUPS = 30;
  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.endsWith(".db"))
    .sort();
  while (files.length > MAX_BACKUPS) {
    const oldest = files.shift();
    if (oldest) fs.unlinkSync(path.join(backupsDir, oldest));
  }

  return backupPath;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
