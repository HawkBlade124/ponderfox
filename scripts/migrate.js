// One-off runner for sql/schema.sql — reuses the same pg connection config
// as server.js. Safe to re-run: every statement in schema.sql is either
// CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, or guarded with its
// own existence check.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "disable" ? false : { rejectUnauthorized: false },
});

const sql = fs.readFileSync(path.join(__dirname, "..", "sql", "schema.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Schema apply failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
