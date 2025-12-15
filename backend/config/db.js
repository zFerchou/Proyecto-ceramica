// src/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,

  // 🔒 FIX CRÍTICO: forzar string
  password: String(process.env.DB_PASSWORD),

  // 🔒 FIX: puerto siempre numérico
  port: Number(process.env.DB_PORT),

  // Opcional pero recomendado en desktop apps
  ssl: false,
});

// ─────────────────────────────────────────────
// Test de conexión (log claro)
// ─────────────────────────────────────────────
pool.on("connect", () => {
  console.log("🟢 PostgreSQL conectado correctamente");
});

pool.on("error", (err) => {
  console.error("🔴 Error en PostgreSQL:", err);
});
