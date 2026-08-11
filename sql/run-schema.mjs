import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env"
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "disable" ? false : { rejectUnauthorized: false },
});

await client.connect();
await client.query(schema);
await client.end();

console.log(`Schema applied to database "${process.env.DB_NAME}"`);
