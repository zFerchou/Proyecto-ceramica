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
import categoriaRoutes from "./routes/categoriaRoutes.js";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

// SOLO cargar .env si estamos en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  console.log('✅ Modo desarrollo: .env cargado');
} else {
  console.log('✅ Modo producción: usando variables de entorno de Docker');
}

// DEBUG: Verifica las variables
console.log('=== VARIABLES DE ENTORNO ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('=======================');

const app = express();

// --- Configurar __dirname en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Iniciando servidor...');
console.log('📁 Directorio actual:', __dirname);

// --- Servir carpeta de QR ---
const qrDir = path.join(__dirname, "public/qr");
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
  console.log('📁 Carpeta QR creada:', qrDir);
}
app.use("/qr", express.static(qrDir));

// --- Servir carpeta de uploads (imágenes de productos) ---
const uploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada:', uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

// --- Configuración de CORS MEJORADA Y CORREGIDA ---
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3001",
  "http://localhost:3002",
  "http://20.75.243.68:3000",
  "http://20.75.243.68"
];

// CONFIGURACIÓN CORS CORREGIDA - AÑADE Cache-Control
app.use(cors({
  origin: function (origin, callback) {
    // En desarrollo, permitir cualquier origen
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // En producción, verificar orígenes permitidos
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origen bloqueado por CORS: ${origin}`);
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Cache-Control",  // <-- AÑADIDO para resolver el error CORS
    "Accept"          // <-- Opcional, pero recomendado
  ],
  credentials: true,
  exposedHeaders: ["Authorization"] // <-- IMPORTANTE para tokens
}));

// Handle preflight requests - CORREGIDO (no usar app.options('*', cors()))
// app.options('*', cors()); // <-- ESTA LÍNCA CAUSA EL ERROR, NO LA USES

// --- Body parser para JSON ---
app.use(express.json({ limit: '10mb' }));

// --- Middleware de logging ---
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Ruta de health check ---
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbHost: process.env.DB_HOST || 'no configurado',
    port: process.env.PORT || 'no configurado'
  });
});

// --- Ruta raíz ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido al API del Sistema de Gestión de Tienda',
    documentation: '/api-docs',
    health: '/health',
    environment: process.env.NODE_ENV || 'development',
    dbConnection: process.env.DB_HOST ? `Conectado a ${process.env.DB_HOST}` : 'No configurada'
  });
});

// --- Documentación Swagger ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
console.log('📚 Swagger configurado en /api-docs');

// --- Rutas principales ---
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/auth", authRoutes);

console.log('✅ Todas las rutas cargadas');

// --- Middleware: Errores de parseo JSON ---
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).json({
      error: "JSON inválido en el body",
      detail: "Asegúrate de que cadenas y claves estén entre comillas dobles. Ejemplo: \"nombre\": \"Taza\""
    });
  }
  next(err);
});

// --- Servir React en producción ---
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  console.log('⚛️  Frontend build detectado, sirviendo archivos estáticos');
}

// --- Redirigir cualquier ruta no API ni /auth a index.html ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/qr') || req.path.startsWith('/uploads')) {
    return next();
  }
  
  // Solo servir React si existe la build
  if (fs.existsSync(frontendBuildPath)) {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  } else {
    next();
  }
});

// --- Manejo de rutas no encontradas ---
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// --- Middleware: Handler global de errores ---
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  
  // Error de CORS
  if (err.message === "No permitido por CORS") {
    return res.status(403).json({ 
      error: "Origen no permitido por CORS",
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// --- INICIAR EL SERVIDOR CON MANEJO MEJORADO ---
const PORT = process.env.PORT || 5000; // Cambiado a 5000 por defecto

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Base de datos: ${process.env.DB_HOST || 'No configurada'}`);
  console.log(`🔗 URL accesible desde host: http://localhost:${process.env.HOST_PORT || 3002}`);
});

// Manejar errores de puerto en uso
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso dentro del contenedor.`);
    console.error('Posibles causas:');
    console.error('1. Otro proceso Node.js está corriendo en el mismo contenedor');
    console.error('2. Hot-reload está creando múltiples instancias');
    console.error('3. El contenedor anterior no se cerró correctamente');
    
    // Intentar con puerto alternativo
    const altPort = parseInt(PORT) + 1;
    console.log(`🔄 Intentando con puerto alternativo: ${altPort}`);
    
    setTimeout(() => {
      server.close();
      process.env.PORT = altPort;
      const newServer = app.listen(altPort, '0.0.0.0', () => {
        console.log(`✅ Servidor iniciado en puerto alternativo: ${altPort}`);
      });
    }, 1000);
  } else {
    console.error('❌ Error crítico al iniciar servidor:', err);
    process.exit(1);
  }
});

// Manejar cierre correcto del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

export default app;