import express from "express";
import productoRoutes from "./routes/productoRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

const app = express();

// Body parser for JSON. We attach a custom error handler below to intercept parse errors
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas
app.use("/api/productos", productoRoutes);

// Middleware para interceptar errores de parseo JSON y devolver JSON legible
app.use((err, req, res, next) => {
	if (err && err.type === 'entity.parse.failed') {
		// body-parser/express setea err.type para errores de parseo JSON
		console.error('JSON parse error:', err.message);
		return res.status(400).json({ error: 'JSON inválido en el body', detail: 'Asegúrate de que cadenas y claves estén entre comillas dobles. Por ejemplo: "nombre": "Taza"' });
	}
	// Delegar a siguiente handler si no es un error de parseo
	next(err);
});

// Handler de errores final (para evitar devolver HTML con stack traces)
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err && err.stack ? err.stack : err);
	res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
