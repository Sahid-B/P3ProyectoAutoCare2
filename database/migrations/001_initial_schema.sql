-- Script de inicializacion de la base de datos de AutoCare.
CREATE TABLE IF NOT EXISTS app_status (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_status (project_name, version)
SELECT 'AutoCare', '0.1.0'
WHERE NOT EXISTS (
    SELECT 1 FROM app_status WHERE project_name = 'AutoCare'
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(255),
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehiculos
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

-- Tabla de mantenimientos
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
