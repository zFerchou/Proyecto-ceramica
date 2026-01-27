# =========================
# Etapa de build (React)
# =========================
FROM node:20-alpine AS build
WORKDIR /app

# Configuración npm para redes lentas
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

# Instala dependencias (usa cache)
COPY package*.json ./
RUN npm ci

# Copia el resto del código
COPY . .

# Compila la app
RUN npm run build


# =========================
# Etapa final (Nginx)
# =========================
FROM nginx:alpine

# Configuración para React Router (SPA)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copia el build generado
COPY --from=build /app/build /usr/share/nginx/html

# Puerto público
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


