-- Migracion 003: crea la tabla de mantenimientos (Parte 4).
--
-- Como aplicarla (con los contenedores levantados):
--   docker exec -i autocare-database psql -U autocare_user -d autocare < database/migrations/003_create_maintenances.sql
--
-- Es idempotente: se puede ejecutar varias veces sin error.

CREATE TABLE IF NOT EXISTS maintenances (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    kilometers INTEGER NOT NULL,
    cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    workshop VARCHAR(150),
    description TEXT,
    next_date DATE,
    next_kilometers INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_maintenances_kilometers CHECK (kilometers >= 0),
    CONSTRAINT chk_maintenances_cost CHECK (cost >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle ON maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_date ON maintenances(date);
