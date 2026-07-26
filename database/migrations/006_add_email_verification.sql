-- Migracion 006: agrega estado de verificacion de correo.
--
-- Las cuentas existentes se marcan como verificadas para no bloquear usuarios
-- creados antes de esta funcionalidad. Las nuevas cuentas tradicionales se
-- insertan como no verificadas hasta validar el codigo enviado por correo.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET email_verified = TRUE
WHERE email_verified = FALSE;
