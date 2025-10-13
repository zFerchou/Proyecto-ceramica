import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import productoRoutes from "./routes/productoRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js"; // ✅ Nueva ruta de usuarios
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

dotenv.config();

const app = express();

// --- Configuración de CORS ---
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// --- Body parser para JSON ---
app.use(express.json());

// --- Documentación Swagger ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- Rutas principales ---
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/auth", authRoutes); // ✅ Ruta agregada para autenticación

// --- Middleware: Errores de parseo JSON ---
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.error("JSON parse error:", err.message);
    return res.status(400).json({
      error: "JSON inválido en el body",
      detail: "Asegúrate de que cadenas y claves estén entre comillas dobles. Ejemplo: \"nombre\": \"Taza\""
    });
  }
  next(err);
});

// --- Middleware: Handler global de errores ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
