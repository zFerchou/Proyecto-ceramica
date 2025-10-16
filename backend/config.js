// config.js - CORREGIDO
module.exports = {
  server: {
    port: process.env.PORT || 8080  // ← Esta debe ser la estructura correcta
  },
  db: {
    user: 'postgres',
    host: 'localhost',
    database: 'tienda',
    password: '123',
    port: 5432
  },
  jwtSecret: process.env.JWT_SECRET || 'tu-clave-secreta-segura-aqui'
};