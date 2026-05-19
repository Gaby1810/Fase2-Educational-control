-- Agrega la columna push_token a la tabla usuarios
-- Ejecutar una sola vez en producción y desarrollo

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS push_token VARCHAR(255) DEFAULT NULL;
