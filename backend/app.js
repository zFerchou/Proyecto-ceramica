import express from "express";
import productoRoutes from "./routes/productoRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "./docs/swagger.js";

const app = express();
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas
app.use("/api/productos", productoRoutes);

export default app;
