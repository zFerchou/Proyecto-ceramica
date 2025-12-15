import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

// Rutas
import productoRoutes from "./routes/productoRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";

const app = express();

// ─────────────────────────────────────────────
// __dirname en ES Modules
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
// Middlewares básicos
// ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Accept"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

// ─────────────────────────────────────────────
// Logging simple
// ─────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────
// Carpetas estáticas
// ─────────────────────────────────────────────
const qrDir = path.join(__dirname, "public/qr");
const uploadsDir = path.join(__dirname, "public/uploads");

fs.mkdirSync(qrDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/qr", express.static(qrDir));
app.use("/uploads", express.static(uploadsDir));

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
// Swagger
// ─────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ─────────────────────────────────────────────
// Rutas API
// ─────────────────────────────────────────────
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/auth", authRoutes);

// ─────────────────────────────────────────────
// React build (producción)
// ─────────────────────────────────────────────
const frontendBuildPath = path.join(__dirname, "../frontend/build");

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/auth") ||
      req.path.startsWith("/qr") ||
      req.path.startsWith("/uploads")
    ) {
      return next();
    }

    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path
  });
});

// ─────────────────────────────────────────────
// Error handler global
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res.status(500).json({
    error: "Internal Server Error"
  });
});

// 🚨 AQUÍ TERMINA app.js
export default app;
