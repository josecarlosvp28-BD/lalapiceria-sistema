import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

let db: Database.Database | null = null;

function getDbPath(): string {
  const userData = app.getPath("userData");
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, "lalapiceria.db");
}

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schemaPath = app.isPackaged
    ? path.join(process.resourcesPath, "schema.sql")
    : path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  seedDefaultAdmin(db);
  return db;
}

function seedDefaultAdmin(database: Database.Database) {
  const row = database.prepare("SELECT COUNT(*) as count FROM usuarios").get() as { count: number };
  if (row.count === 0) {
    database
      .prepare(
        "INSERT INTO usuarios (nombre, email, rol, pin_hash, activo) VALUES (?, ?, 'admin', ?, 1)"
      )
      .run("Administrador", null, "0000");
  }
}

export function backupDatabase(): string {
  const database = getDb();
  const userData = app.getPath("userData");
  const backupsDir = path.join(userData, "backups");
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
