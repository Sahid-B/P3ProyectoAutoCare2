-- Migracion 011: campos adicionales de talleres.
-- Se agregan de forma aditiva (IF NOT EXISTS) para no afectar los datos actuales.
-- - horario y descripcion: se muestran en el popup del mapa del cliente.
-- - estado: permite al administrador activar/desactivar un taller.
-- - updated_at: la columna ya se usaba en talleres-service al actualizar el taller,
--   pero no existia en la tabla, por lo que el UPDATE fallaba.

ALTER TABLE talleres ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS horario VARCHAR(150);
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo';
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_talleres_estado'
    ) THEN
        ALTER TABLE talleres
            ADD CONSTRAINT chk_talleres_estado CHECK (estado IN ('activo', 'inactivo', 'suspendido'));
    END IF;
END
$$;
