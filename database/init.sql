-- Script de inicializacion de la base de datos de AutoCare.
-- Parte 1: solo se crea una tabla de control para verificar que la base de datos
-- se inicializa correctamente. Las tablas de usuarios, vehiculos y mantenimientos
-- se crearan en las siguientes partes del proyecto.

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

-- Tabla de usuarios (Parte 2)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

