/*
  # Actualizar tabla de testimonios

  1. Cambios en la tabla `testimonials`:
    - Agregar columna `position` (text, opcional)
    - Agregar columna `company` (text, opcional)
    - Agregar columna `avatar_url` (text, opcional)
    - Agregar columna `is_approved` (boolean, default false)
    - Agregar columna `tags` (text[], opcional)
  
  2. Actualizar restricciones:
    - Hacer que `user_id` y `workshop_id` sean NOT NULL
    - Agregar restricción CHECK para rating (1-5)
*/

-- Verificar si las columnas ya existen y agregarlas si no
DO $$
BEGIN
  -- Agregar columna position si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'position'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN position text;
  END IF;

  -- Agregar columna company si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'company'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN company text;
  END IF;

  -- Agregar columna avatar_url si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN avatar_url text;
  END IF;

  -- Agregar columna is_approved si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
  END IF;

  -- Agregar columna tags si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'tags'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN tags text[];
  END IF;

  -- Actualizar restricciones para user_id y workshop_id
  ALTER TABLE testimonials 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN workshop_id SET NOT NULL;

  -- Asegurar que rating tenga la restricción CHECK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public' AND constraint_name = 'testimonials_rating_check'
  ) THEN
    ALTER TABLE testimonials 
      ADD CONSTRAINT testimonials_rating_check 
      CHECK (rating >= 1 AND rating <= 5);
  END IF;

END $$;

-- Actualizar políticas de seguridad
DROP POLICY IF EXISTS "Testimonios aprobados son visibles para todos" ON testimonials;
CREATE POLICY "Testimonios aprobados son visibles para todos"
  ON testimonials
  FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propios testimonios" ON testimonials;
CREATE POLICY "Usuarios pueden crear sus propios testimonios"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios testimonios" ON testimonials;
CREATE POLICY "Usuarios pueden ver sus propios testimonios"
  ON testimonials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Nota: La política de administradores se implementará cuando se agregue el campo role a la tabla users
-- Por ahora, se omite esta política
-- DROP POLICY IF EXISTS "Administradores pueden gestionar todos los testimonios" ON testimonials;

-- Crear índices para mejorar el rendimiento si no existen
CREATE INDEX IF NOT EXISTS testimonials_user_id_idx ON testimonials (user_id);
CREATE INDEX IF NOT EXISTS testimonials_workshop_id_idx ON testimonials (workshop_id);
CREATE INDEX IF NOT EXISTS testimonials_is_approved_idx ON testimonials (is_approved);
CREATE INDEX IF NOT EXISTS testimonials_is_featured_idx ON testimonials (is_featured);
