import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";

// ─────────────────────────────────────────────
// __dirname en ESM
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
// Entorno
// ─────────────────────────────────────────────
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// ─────────────────────────────────────────────
// Cargar .env
// ─────────────────────────────────────────────
dotenv.config({
  path: path.join(__dirname, ".env")
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`🎉 Servidor corriendo en http://127.0.0.1:${PORT}`);
  console.log(`❤️ Health: http://127.0.0.1:${PORT}/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    process.exit(1);
  }
  console.error("💥 Error servidor:", err);
  process.exit(1);
});
