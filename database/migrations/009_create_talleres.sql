-- Migracion 009: Creacion de tabla talleres y actualizacion de roles

CREATE TABLE IF NOT EXISTS talleres (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre_taller VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(30),
    latitud NUMERIC(10, 8) NOT NULL,
    longitud NUMERIC(11, 8) NOT NULL,
    calificacion NUMERIC(3, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_talleres_usuario ON talleres(usuario_id);
