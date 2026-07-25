-- Migracion 004: agrega soporte para autenticacion OAuth con Google (Parte 4).
-- Es idempotente: se puede ejecutar varias veces sin error.

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
