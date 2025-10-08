import express from "express";
import cors from "cors"; // <-- IMPORTAR cors
import productoRoutes from "./routes/productoRoutes.js";
import ventaRoutes from './routes/ventaRoutes.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:3001', // <-- puerto de tu frontend
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

// Body parser for JSON
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas
app.use("/api/productos", productoRoutes);
app.use('/ventas', ventaRoutes);

// Middleware para interceptar errores de parseo JSON y devolver JSON legible
app.use((err, req, res, next) => {
	if (err && err.type === 'entity.parse.failed') {
		console.error('JSON parse error:', err.message);
		return res.status(400).json({ 
			error: 'JSON inválido en el body', 
			detail: 'Asegúrate de que cadenas y claves estén entre comillas dobles. Por ejemplo: "nombre": "Taza"' 
		});
	}
	next(err);
});

// Handler de errores final
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err && err.stack ? err.stack : err);
	res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
