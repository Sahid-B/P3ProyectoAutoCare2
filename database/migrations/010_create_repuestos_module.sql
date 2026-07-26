-- Migracion 010: modulo de repuestos (vendedores, productos, compras y detalles).
-- Se apoya en las tablas ya existentes (users) sin modificarlas.

-- A. Vendedores de repuestos (tienda fisica asociada a un usuario)
CREATE TABLE IF NOT EXISTS vendedores_repuestos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nombre_local VARCHAR(120) NOT NULL,
    descripcion TEXT,
    direccion TEXT NOT NULL,
    latitud NUMERIC(10, 8) NOT NULL,
    longitud NUMERIC(11, 8) NOT NULL,
    telefono VARCHAR(30),
    horario VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vendedores_estado CHECK (estado IN ('activo', 'inactivo', 'suspendido'))
);

CREATE INDEX IF NOT EXISTS idx_vendedores_usuario ON vendedores_repuestos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_estado ON vendedores_repuestos(estado);

-- B. Productos o repuestos publicados por un vendedor
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    vendedor_id INTEGER NOT NULL REFERENCES vendedores_repuestos(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(40) NOT NULL,
    marca VARCHAR(80),
    compatibilidad TEXT,
    precio NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    imagen_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_productos_precio CHECK (precio > 0),
    CONSTRAINT chk_productos_stock CHECK (stock >= 0),
    CONSTRAINT chk_productos_estado CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX IF NOT EXISTS idx_productos_vendedor ON productos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

-- C. Compras (una compra agrupa los productos de un mismo vendedor)
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendedor_id INTEGER NOT NULL REFERENCES vendedores_repuestos(id) ON DELETE CASCADE,
    total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'simulado',
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    transaccion_id VARCHAR(150),
    fecha_pago TIMESTAMP,
    estado_pedido VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_compras_total CHECK (total >= 0),
    CONSTRAINT chk_compras_metodo_pago CHECK (metodo_pago IN ('paypal', 'simulado')),
    CONSTRAINT chk_compras_estado_pago CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido', 'reembolsado')),
    CONSTRAINT chk_compras_estado_pedido CHECK (
        estado_pedido IN ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')
    )
);

CREATE INDEX IF NOT EXISTS idx_compras_cliente ON compras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_compras_vendedor ON compras(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_estado_pedido ON compras(estado_pedido);

-- D. Detalles de cada compra. El nombre del producto se guarda como copia
-- historica para que el pedido siga siendo legible si el producto se elimina.
CREATE TABLE IF NOT EXISTS compra_detalles (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    CONSTRAINT chk_detalles_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalles_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalles_subtotal CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_detalles_compra ON compra_detalles(compra_id);
CREATE INDEX IF NOT EXISTS idx_detalles_producto ON compra_detalles(producto_id);
