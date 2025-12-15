import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  database: process.env.DB_NAME || "tienda",
  password: process.env.DB_PASSWORD || "123",
  port: Number(process.env.DB_PORT) || 5432,
  ssl: false,
});
