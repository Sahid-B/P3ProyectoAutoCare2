-- Agregar columnas rol y is_active a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Insertar el usuario administrador por defecto si no existe
INSERT INTO users (nombre, apellido, correo, password_hash, email_verified, is_2fa_enabled, rol)
SELECT 'Super', 'Administrador', 'admin@gmail.com', '$2b$10$xO/.Q2jg6iTyruIDiodoIuNNV2pCBIKAWO9hAZtV.LBpZAlhzEVIG', TRUE, FALSE, 'admin'
WHERE NOT EXISTS (
    SELECT id FROM users WHERE correo = 'admin@gmail.com'
);
