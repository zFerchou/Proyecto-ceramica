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
    servers: [
      { url: "http://localhost:3000/api", description: "Local API" }
    ],
  },
  apis: ["./routes/*.js"],
};

export const swaggerSpecs = swaggerJsdoc(swaggerOptions);
