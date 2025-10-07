-- DB initialization for Proyecto-ceramica
-- Creates tables: categoria, producto, codigo_barras

-- Table: categoria
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT
);

-- Table: producto
CREATE TABLE IF NOT EXISTS producto (
  id_producto SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  id_categoria INTEGER REFERENCES categoria(id_categoria) ON DELETE SET NULL
);

-- Unique constraint on nombre (you mentioned adding this):
ALTER TABLE producto
  ADD CONSTRAINT IF NOT EXISTS producto_nombre_unique UNIQUE (nombre);

-- Table: codigo_barras
CREATE TABLE IF NOT EXISTS codigo_barras (
  id_codigo SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  id_producto INTEGER REFERENCES producto(id_producto) ON DELETE CASCADE
);

-- Optional: sample category
INSERT INTO categoria (nombre, descripcion)
SELECT 'Vajilla', 'Categoría de vajilla' WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre='Vajilla');
