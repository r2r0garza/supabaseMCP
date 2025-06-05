/*
  # Crear tabla de usuarios

  1. Nueva Tabla
    - `users`
      - `id` (uuid, primary key) - Corresponde al id de autenticación de Supabase
      - `email` (text, unique) - Email del usuario
      - `full_name` (text) - Nombre completo del usuario
      - `phone` (text) - Número de teléfono del usuario
      - `created_at` (timestamptz) - Fecha de creación del registro
      - `updated_at` (timestamptz) - Fecha de última actualización del registro
  
  2. Seguridad
    - Habilitar RLS en la tabla `users`
    - Agregar políticas para que los usuarios solo puedan ver y actualizar su propio perfil
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp de actualización
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
