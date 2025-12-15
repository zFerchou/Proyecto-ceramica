import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// JWT
import { verifyJWT } from "./middlewares/authMiddleware.js";

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
// Middlewares base
// ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

app.use(cors({
  origin: true,
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
// Logging
// ─────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ─────────────────────────────────────────────
// Carpetas persistentes (fuera del asar)
// ─────────────────────────────────────────────
const dataDir = path.join(process.cwd(), "data");
const qrDir = path.join(dataDir, "qr");
const uploadsDir = path.join(dataDir, "uploads");

fs.mkdirSync(qrDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/qr", express.static(qrDir));
app.use("/uploads", express.static(uploadsDir));

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// ─────────────────────────────────────────────
// Swagger (solo DEV)
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const swaggerUi = (await import("swagger-ui-express")).default;
  const { swaggerSpecs } = await import("./docs/swagger.js");

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
app.use("/auth", authRoutes);

// ─────────────────────────────────────────────
// API protegida
// ─────────────────────────────────────────────
app.use("/api", verifyJWT);
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categorias", categoriaRoutes);

// ─────────────────────────────────────────────
// FRONTEND (React build) ✅ FIX REAL
// ─────────────────────────────────────────────
const frontendPath =
  process.env.NODE_ENV === "production"
    ? path.join(process.resourcesPath, "frontend", "build")
    : path.join(__dirname, "..", "frontend", "build");

console.log("📦 Frontend path:", frontendPath);

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  console.error("❌ Frontend build NO encontrado");
}

// ─────────────────────────────────────────────
// Error handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
