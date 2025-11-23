# Usa Node.js LTS
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias de producción
RUN npm install --production

# Copia todo el código fuente
COPY . .

# Expone el puerto que usará la app
EXPOSE 3000

# Cambia esta línea - apunta directamente a server.js
CMD ["node", "server.js"]