# Usa Nginx para servir el build de React
FROM nginx:alpine

# Copia build al directorio de Nginx
COPY build/ /usr/share/nginx/html

# Copia configuración de Nginx si la tienes
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
