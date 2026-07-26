-- Migracion 012: unificacion de los valores de la columna users.rol.
--
-- Situacion previa: la migracion 008 dejo DEFAULT 'user', pero el registro por
-- formulario guardaba 'usuario'. Como consecuencia convivian dos valores para el
-- mismo rol de cliente y las estadisticas del administrador (que filtraban por
-- rol = 'user') dejaban fuera a los usuarios registrados desde el formulario.
--
-- A partir de aqui los roles validos son:
--   'usuario'              -> cliente
--   'taller'               -> taller mecanico
--   'vendedor_repuestos'   -> tienda de repuestos
--   'admin'                -> administrador

UPDATE users SET rol = 'usuario' WHERE rol IS NULL OR rol = 'user';

ALTER TABLE users ALTER COLUMN rol SET DEFAULT 'usuario';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_rol'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT chk_users_rol
            CHECK (rol IN ('usuario', 'taller', 'vendedor_repuestos', 'admin'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
