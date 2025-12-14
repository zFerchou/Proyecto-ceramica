FROM node:20-alpine

WORKDIR /app

# Instala dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código fuente
COPY . .

# Elimina TODOS los archivos .env posibles
RUN find . -name "*.env*" -type f -delete 2>/dev/null || true

# Crea directorios necesarios
RUN mkdir -p public/uploads public/qr

# Usa app.js como punto de entrada
CMD ["node", "app.js"]