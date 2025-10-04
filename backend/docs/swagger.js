// src/docs/swagger.js
import swaggerJsdoc from "swagger-jsdoc";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Swagger de Ceramica",
      version: "1.0.0",
      description: "APIs",
    },
  },
  apis: ["./routes/*.js"],
};

export const swaggerSpecs = swaggerJsdoc(swaggerOptions);
