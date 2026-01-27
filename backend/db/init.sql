-- Inicialización de la base de datos 'tienda' para Docker
-- Basado en tienda_con_inserts.sql

-- 1. Eliminar tablas si existen (opcional, para empezar limpio)
DROP TABLE IF EXISTS venta_usuario CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS ticket_producto CASCADE;
DROP TABLE IF EXISTS ticket CASCADE;
DROP TABLE IF EXISTS producto_express CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS codigo_qr CASCADE;
DROP TABLE IF EXISTS codigo_barras CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS turnos_trabajo CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Crear función
CREATE OR REPLACE FUNCTION registrar_venta_con_usuario(
    p_tipo_pago VARCHAR,
    p_qr_code VARCHAR,
    p_id_usuario INTEGER,
    OUT p_id_venta INTEGER
) RETURNS INTEGER AS $$
BEGIN
    -- Insertar venta
    INSERT INTO venta (tipo_pago, qr_code)
    VALUES (p_tipo_pago, p_qr_code)
    RETURNING id_venta INTO p_id_venta;

    -- Registrar relación venta - usuario
    INSERT INTO venta_usuario (id_venta, id_usuario)
    VALUES (p_id_venta, p_id_usuario);

    -- Actualizar último acceso
    UPDATE usuarios
    SET ultimo_acceso = CURRENT_TIMESTAMP
    WHERE id = p_id_usuario;

    -- Actualizar total del turno activo
    UPDATE turnos_trabajo 
    SET total_ventas = total_ventas + (
        SELECT COALESCE(SUM(tp.cantidad * p.precio), 0)
        FROM ticket t
        JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
        JOIN producto p ON tp.id_producto = p.id_producto
        WHERE t.id_venta = p_id_venta
    )
    WHERE id_usuario = p_id_usuario AND activo = true;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear tablas
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    eliminado BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    id_categoria INTEGER REFERENCES categoria(id_categoria),
    imagen_url TEXT
);

CREATE TABLE codigo_barras (
    id_codigo SERIAL PRIMARY KEY,
    codigo VARCHAR(255) NOT NULL UNIQUE,
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto)
);

CREATE TABLE codigo_qr (
    id_qr SERIAL PRIMARY KEY,
    codigo_qr UUID NOT NULL UNIQUE,
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    reset_token TEXT,
    reset_token_expiration TIMESTAMP,
    reset_password_token VARCHAR(100),
    reset_password_expires TIMESTAMP,
    nombre VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    username VARCHAR(100)
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    critica BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL
);

CREATE TABLE turnos_trabajo (
    id_turno SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    total_ventas NUMERIC(15,2) DEFAULT 0
);

CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_pago VARCHAR(50) NOT NULL
);

CREATE TABLE venta_usuario (
    id_venta_usuario SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_venta, id_usuario)
);

CREATE TABLE ticket (
    id_ticket SERIAL PRIMARY KEY,
    codigo_venta VARCHAR(50) NOT NULL UNIQUE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_venta INTEGER NOT NULL REFERENCES venta(id_venta)
);

CREATE TABLE ticket_producto (
    id_ticket_producto SERIAL PRIMARY KEY,
    id_ticket INTEGER NOT NULL REFERENCES ticket(id_ticket),
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2),
    precio_total NUMERIC(12,2),
    nombre_personalizado TEXT
);

CREATE TABLE producto_express (
    id_express SERIAL PRIMARY KEY,
    id_ticket INTEGER NOT NULL REFERENCES ticket(id_ticket) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) DEFAULT 'Venta Express',
    cantidad INTEGER NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad::numeric * precio) STORED
);

-- 4. Insertar datos
INSERT INTO usuarios (email, password, rol, telefono, direccion, nombre, activo) 
VALUES (
    'nayar_garci.com@hotmail.com',
    '$2b$12$Nz6OwBtrMfo4mvQw0wb85OesmMMgqvWfJg3mFYddJYjkGrEpI0pIa',
    'Admin',
    '4181240354',
    'Universidad',
    'Guadalupe',
    true
) ON CONFLICT (email) DO NOTHING;

-- 5. Crear índices
CREATE INDEX idx_turnos_usuario_activo ON turnos_trabajo (id_usuario) WHERE activo = true;
CREATE UNIQUE INDEX idx_usuarios_username ON usuarios (username) WHERE username IS NOT NULL;
CREATE INDEX idx_venta_usuario_id_usuario ON venta_usuario (id_usuario);
CREATE INDEX idx_venta_usuario_id_venta ON venta_usuario (id_venta);

-- 6. Crear vistas (opcional, si las necesitas)
CREATE OR REPLACE VIEW vista_ventas_usuario AS
 SELECT vu.id_venta_usuario,
    vu.id_venta,
    vu.id_usuario,
    u.username,
    u.nombre AS nombre_usuario,
    u.email,
    v.fecha,
    v.tipo_pago,
    count(tp.id_ticket_producto) AS total_productos,
    sum(((tp.cantidad)::numeric * p.precio)) AS total_venta
   FROM (((((venta_usuario vu
     JOIN usuarios u ON ((vu.id_usuario = u.id)))
     JOIN venta v ON ((vu.id_venta = v.id_venta)))
     LEFT JOIN ticket t ON ((v.id_venta = t.id_venta)))
     LEFT JOIN ticket_producto tp ON ((t.id_ticket = tp.id_ticket)))
     LEFT JOIN producto p ON ((tp.id_producto = p.id_producto)))
  GROUP BY vu.id_venta_usuario, vu.id_venta, vu.id_usuario, u.username, u.nombre, u.email, v.fecha, v.tipo_pago;