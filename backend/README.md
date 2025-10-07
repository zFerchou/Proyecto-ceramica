# Backend - Proyecto-ceramica

Instrucciones rápidas para inicializar la base de datos y probar endpoints.

## Crear tablas

Asegúrate de tener variables de entorno en `backend/.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME).

Ejecuta el script SQL:

```powershell
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f db/init.sql
```

Esto crea las tablas `categoria`, `producto` (con UNIQUE sobre `nombre`) y `codigo_barras`.

## Ejecutar el servidor

Desde la carpeta `backend`:

```powershell
npm install
npm run dev
```

El servidor por defecto corre en http://localhost:3000 (según `server.js`).

## Probar endpoints

Crear producto (ejemplo válido):

```powershell
curl -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d '{"nombre":"Taza","descripcion":"Taza de cerámica","cantidad":10,"precio":5.5,"id_categoria":1}'
```

Si se intenta crear con el mismo `nombre`, la respuesta será 409 y devolverá el id existente:

```json
{ "error": "Producto con el mismo nombre ya existe", "existingId": 1 }
```

Ejemplo invalid JSON (devuelve 400):

```powershell
curl -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d '{"nombre": Taza, "cantidad": 5}'
```

Abrir Swagger UI: http://localhost:3000/api-docs
