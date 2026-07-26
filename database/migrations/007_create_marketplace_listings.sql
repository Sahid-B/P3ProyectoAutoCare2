-- Migracion 007: modulo de compra/venta y tasacion de autos.

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    anio INTEGER NOT NULL,
    kilometraje INTEGER NOT NULL DEFAULT 0,
    ciudad VARCHAR(80),
    tipo_vehiculo VARCHAR(20) NOT NULL DEFAULT 'automovil',
    precio_vendedor NUMERIC(12,2) NOT NULL,
    imagen_url TEXT,
    estado_visual VARCHAR(20) NOT NULL DEFAULT 'bueno',
    historial_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'parcial',
    danos_reportados VARCHAR(20) NOT NULL DEFAULT 'ninguno',
    precio_sugerido_min NUMERIC(12,2) NOT NULL,
    precio_sugerido_max NUMERIC(12,2) NOT NULL,
    precio_sugerido NUMERIC(12,2) NOT NULL,
    puntaje INTEGER NOT NULL,
    veredicto VARCHAR(30) NOT NULL,
    analisis TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_marketplace_anio CHECK (anio >= 1900 AND anio <= 2100),
    CONSTRAINT chk_marketplace_kilometraje CHECK (kilometraje >= 0),
    CONSTRAINT chk_marketplace_precio CHECK (precio_vendedor >= 0),
    CONSTRAINT chk_marketplace_puntaje CHECK (puntaje >= 0 AND puntaje <= 100)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_usuario ON marketplace_listings(usuario_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_precio ON marketplace_listings(precio_sugerido);
