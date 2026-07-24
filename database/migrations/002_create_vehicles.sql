-- Migracion 002: crea la tabla de vehiculos (Parte 3).
--
-- Cuando ejecutar esta migracion:
--   El script database/init.sql SOLO se ejecuta automaticamente cuando el
--   volumen de PostgreSQL se crea por primera vez. Si la base de datos ya
--   existe (Partes 1 y 2 ya corrieron), Docker NO vuelve a ejecutar init.sql,
--   por lo que esta tabla debe aplicarse manualmente con esta migracion.
--
-- Como aplicarla (con los contenedores levantados):
--   docker exec -i autocare-database psql -U autocare_user -d autocare < database/migrations/002_create_vehicles.sql
--
-- Es idempotente: se puede ejecutar varias veces sin error.

CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    anio INTEGER NOT NULL,
    placa VARCHAR(20) NOT NULL,
    color VARCHAR(40),
    tipo_vehiculo VARCHAR(20) NOT NULL DEFAULT 'otro',
    kilometraje_actual INTEGER NOT NULL DEFAULT 0,
    imagen_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vehiculos_anio CHECK (anio >= 1900 AND anio <= 2100),
    CONSTRAINT chk_vehiculos_kilometraje CHECK (kilometraje_actual >= 0),
    CONSTRAINT uq_vehiculos_placa_usuario UNIQUE (usuario_id, placa)
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_usuario ON vehiculos(usuario_id);
