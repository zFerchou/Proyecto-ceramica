import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import productoRoutes from "./routes/productoRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

dotenv.config();

const app = express();

// --- Configurar __dirname en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Servir carpeta de QR ---
app.use("/qr", express.static(path.join(__dirname, "public/qr")));

// --- Configuración de CORS ---
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
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
app.use("/api/dashboard", dashboardRoutes);
app.use("/auth", authRoutes);

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

// --- Servir React en producción ---
app.use(express.static(path.join(__dirname, "../frontend/build"))); // Ahora apunta a frontend/build

// --- Redirigir cualquier ruta no API ni /auth a index.html ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return next();
  res.sendFile(path.join(__dirname, "../frontend/build", 'index.html'));
});

// --- Middleware: Handler global de errores ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
