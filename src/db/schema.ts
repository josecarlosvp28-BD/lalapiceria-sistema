// La Lapicería — esquema de base de datos local (SQLite)
// Todos los montos se guardan en CENTAVOS (enteros) para evitar errores de punto flotante.
//
// Se define como string en TypeScript (en vez de un archivo .sql aparte) para que quede
// incluido automáticamente en el bundle de Vite/Electron sin depender de rutas de archivos
// en tiempo de ejecución, que se rompen fácilmente entre modo desarrollo y app empaquetada.
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'vendedor', 'taller_grabado')),
  pin_hash TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('lapicero', 'pluma_fuente', 'roller', 'portaminas', 'accesorio', 'estuche')),
  variante_color TEXT,
  variante_acabado TEXT,
  variante_punta TEXT CHECK (variante_punta IS NULL OR variante_punta IN ('fina', 'media', 'gruesa')),
  costo_centavos INTEGER NOT NULL DEFAULT 0,
  precio_centavos INTEGER NOT NULL DEFAULT 0,
  proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  ubicacion TEXT CHECK (ubicacion IS NULL OR ubicacion IN ('vitrina', 'almacen')),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'descontinuado', 'agotado')),
  origen TEXT NOT NULL DEFAULT 'local' CHECK (origen IN ('local', 'online')),
  external_woo_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  numero_documento TEXT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  total_centavos INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compras_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  costo_unitario_centavos INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'merma')),
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  referencia_tipo TEXT CHECK (referencia_tipo IS NULL OR referencia_tipo IN ('compra', 'venta', 'devolucion', 'ajuste_manual', 'grabado')),
  referencia_id INTEGER,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inv_mov_producto ON inventario_movimientos(producto_id);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  dni_ruc TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  fecha_nacimiento TEXT,
  tipo_cliente TEXT NOT NULL DEFAULT 'retail' CHECK (tipo_cliente IN ('retail', 'mayorista', 'corporativo')),
  marca_favorita TEXT,
  presupuesto_rango TEXT,
  notas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  descuento_centavos INTEGER NOT NULL DEFAULT 0,
  descuento_motivo TEXT,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada')),
  canal TEXT NOT NULL DEFAULT 'local' CHECK (canal IN ('local', 'online')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);

CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio_unitario_centavos INTEGER NOT NULL,
  descuento_centavos INTEGER NOT NULL DEFAULT 0,
  subtotal_centavos INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas_pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia', 'yape_plin')),
  monto_centavos INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ordenes_grabado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
  texto_grabado TEXT NOT NULL,
  tipo_fuente TEXT,
  posicion TEXT,
  imagen_referencia_path TEXT,
  fecha_recepcion TEXT NOT NULL DEFAULT (datetime('now')),
  fecha_entrega_estimada TEXT,
  fecha_entrega_real TEXT,
  estado TEXT NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_proceso', 'control_calidad', 'listo', 'entregado')),
  responsable_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  costo_adicional_centavos INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_grabado_estado ON ordenes_grabado(estado);
CREATE INDEX IF NOT EXISTS idx_grabado_cliente ON ordenes_grabado(cliente_id);

CREATE TABLE IF NOT EXISTS garantias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
  marca TEXT,
  falla TEXT NOT NULL,
  fecha_ingreso TEXT NOT NULL DEFAULT (datetime('now')),
  fecha_entrega TEXT,
  estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('en_revision', 'en_reparacion', 'listo', 'entregado', 'no_procede')),
  notas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cotizaciones_corporativas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'cotizacion' CHECK (estado IN ('cotizacion', 'aprobacion', 'produccion', 'entrega')),
  total_centavos INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
  fecha_entrega_estimada TEXT,
  notas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cotizaciones_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cotizacion_id INTEGER NOT NULL REFERENCES cotizaciones_corporativas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio_unitario_centavos INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS caja_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  usuario_apertura_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  monto_apertura_centavos INTEGER NOT NULL DEFAULT 0,
  usuario_cierre_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  monto_cierre_esperado_centavos INTEGER,
  monto_cierre_real_centavos INTEGER,
  diferencia_centavos INTEGER,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  notas TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
