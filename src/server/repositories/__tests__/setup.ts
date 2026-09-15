import Database from "better-sqlite3";
import { SCHEMA_SQL } from "../../../db/schema";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}
