/*
  # Crear tabla de testimonios

  1. Nueva Tabla
    - `testimonials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key → users.id)
      - `workshop_id` (uuid, foreign key → workshops.id)
      - `content` (text)
      - `position` (text, opcional)
      - `company` (text, opcional)
      - `avatar_url` (text, opcional)
      - `rating` (integer)
      - `is_featured` (boolean)
      - `is_approved` (boolean)
      - `tags` (text[], opcional)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `testimonials` table
    - Add policy for authenticated users to read approved testimonials
    - Add policy for authenticated users to insert their own testimonials
    - Add policy for admin users to manage all testimonials
*/

-- Crear tabla de testimonios si no existe
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  position text,
  company text,
  avatar_url text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_featured boolean DEFAULT false NOT NULL,
  is_approved boolean DEFAULT false NOT NULL,
  tags text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Política para que cualquier usuario pueda leer testimonios aprobados
CREATE POLICY "Testimonios aprobados son visibles para todos"
  ON testimonials
  FOR SELECT
  USING (is_approved = true);

-- Política para que los usuarios autenticados puedan insertar sus propios testimonios
CREATE POLICY "Usuarios pueden crear sus propios testimonios"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan ver sus propios testimonios (incluso no aprobados)
CREATE POLICY "Usuarios pueden ver sus propios testimonios"
  ON testimonials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para que los administradores puedan gestionar todos los testimonios
CREATE POLICY "Administradores pueden gestionar todos los testimonios"
  ON testimonials
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS testimonials_user_id_idx ON testimonials (user_id);
CREATE INDEX IF NOT EXISTS testimonials_workshop_id_idx ON testimonials (workshop_id);
CREATE INDEX IF NOT EXISTS testimonials_is_approved_idx ON testimonials (is_approved);
CREATE INDEX IF NOT EXISTS testimonials_is_featured_idx ON testimonials (is_featured);
