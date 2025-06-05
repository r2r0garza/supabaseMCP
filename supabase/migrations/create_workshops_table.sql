/*
  # Create workshops table

  1. New Tables
    - `workshops`
      - `id` (uuid, primary key)
      - `slug` (text, unique)
      - `name` (text)
      - `short_description` (text)
      - `full_description` (text)
      - `image_url` (text)
      - `gallery_images` (text[])
      - `video_url` (text)
      - `topics` (jsonb)
      - `is_exclusive` (boolean)
      - `exclusivity_note` (text)
      - `includes` (text[])
      - `cta_text` (text)
      - `metadata` (jsonb)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `workshops` table
    - Add policy for authenticated users to read all workshops
    - Add policy for authenticated users with admin role to manage workshops
*/

CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  full_description text NOT NULL,
  image_url text NOT NULL,
  gallery_images text[] DEFAULT '{}',
  video_url text,
  topics jsonb DEFAULT '[]'::jsonb,
  is_exclusive boolean DEFAULT false,
  exclusivity_note text,
  includes text[] DEFAULT '{}',
  cta_text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Create policy for reading workshops (anyone can read active workshops)
CREATE POLICY "Anyone can read active workshops"
  ON workshops
  FOR SELECT
  USING (active = true);

-- Create policy for authenticated users with admin role to manage workshops
CREATE POLICY "Admins can manage workshops"
  ON workshops
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_workshops_updated_at
BEFORE UPDATE ON workshops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial workshop data
INSERT INTO workshops (
  id, 
  slug, 
  name, 
  short_description, 
  full_description, 
  image_url, 
  gallery_images, 
  video_url, 
  topics, 
  is_exclusive, 
  exclusivity_note, 
  includes, 
  cta_text, 
  metadata, 
  active
) VALUES 
-- The Dinner
(
  '25c456d1-1939-4e82-803c-4c2cca939264',
  'the-dinner',
  'The Dinner',
  'Taller presencial de alta gastronomía y educación financiera.',
  '<p>Una cena de 6 tiempos con 5 temas clave sobre finanzas personales.</p>
  <p>La dinámica consiste en que cada vez que se sirve un tiempo, Boss explica en los primeros dos minutos las "reglas de dedo" más importantes de ese tema, y a partir de ahí cada invitado puede preguntar una cosa sobre el tema, hasta completar la mesa de 15 personas.</p>
  <p>Se convierte en un espacio íntimo y exclusivo, sin censura, sin tabúes, en donde todos pueden preguntar lo que nunca se podía decir.</p>',
  '/images/logos/The Dinner.png',
  '{}',
  NULL,
  '[
    {
      "id": "money",
      "title": "Money",
      "description": "Psicología del dinero",
      "icon": "psychology"
    },
    {
      "id": "debt",
      "title": "Debt",
      "description": "Manejo de deuda",
      "icon": "account_balance"
    },
    {
      "id": "chaos",
      "title": "Chaos",
      "description": "Riesgos",
      "icon": "warning"
    },
    {
      "id": "market",
      "title": "Market",
      "description": "Inversiones",
      "icon": "trending_up"
    },
    {
      "id": "wealth",
      "title": "Wealth",
      "description": "Patrimonio",
      "icon": "account_balance_wallet"
    }
  ]',
  false,
  NULL,
  '{
    "Cena de 6 tiempos",
    "Bebidas",
    "Material didáctico",
    "Certificado de participación"
  }',
  'Reserva tu lugar',
  '{
    "title": "The Dinner | The Full Boss Financial Experience",
    "description": "Taller presencial de alta gastronomía y educación financiera con Jorge Fernández.",
    "keywords": ["finanzas personales", "educación financiera", "cena", "inversiones", "patrimonio"]
  }',
  true
),
-- The Brunch
(
  '6e91a696-8ad8-43b0-abf1-908b1e5b3929',
  'the-brunch',
  'The Brunch',
  'Experiencia gastronómica/financiera exclusiva para mujeres.',
  '<p>Un brunch exclusivo para mujeres donde se abordan temas financieros específicos.</p>
  <p>La dinámica consiste en que cada vez que se sirve un tiempo, Boss explica en los primeros dos minutos las "reglas de dedo" más importantes de ese tema, y a partir de ahí cada invitada puede preguntar una cosa sobre el tema, hasta completar la mesa de 15 personas.</p>
  <p>Se convierte en un espacio íntimo y exclusivo, sin censura, sin tabúes, en donde todas pueden preguntar lo que nunca se podía decir.</p>
  <p>Incluye la bebida especial: The Mimosa.</p>',
  '/images/logos/The Brunch.png',
  '{}',
  NULL,
  '[
    {
      "id": "money-psychology",
      "title": "Psicología del dinero",
      "description": "Entendiendo nuestra relación con el dinero",
      "icon": "psychology"
    },
    {
      "id": "money-relationship",
      "title": "Dinero y pareja",
      "description": "Finanzas en las relaciones",
      "icon": "favorite"
    },
    {
      "id": "patrimony",
      "title": "Patrimonio",
      "description": "Construcción de patrimonio",
      "icon": "account_balance_wallet"
    },
    {
      "id": "open-questions",
      "title": "Preguntas abiertas",
      "description": "Espacio para resolver dudas específicas",
      "icon": "question_answer"
    }
  ]',
  true,
  'Solo para mujeres',
  '{
    "Brunch completo",
    "Bebida especial: The Mimosa",
    "Material didáctico",
    "Certificado de participación"
  }',
  'Reserva tu lugar',
  '{
    "title": "The Brunch | The Full Boss Financial Experience",
    "description": "Experiencia gastronómica/financiera exclusiva para mujeres con Jorge Fernández.",
    "keywords": ["finanzas para mujeres", "educación financiera", "brunch", "patrimonio", "dinero y pareja"]
  }',
  true
),
-- Read The Fucking Room
(
  '3cb9c062-ed99-4c80-941e-bf462648acf1',
  'read-the-fucking-room',
  'Read The Fucking Room',
  'Taller sobre lectura de contexto, lenguaje y presencia.',
  '<p>Un taller dinámico sobre cómo leer el contexto, el lenguaje y la presencia en diferentes situaciones.</p>
  <p>Disponible en formato presencial o en línea.</p>
  <p>La versión en línea incluye acceso a la grabación vía Vimeo.</p>
  <p>La versión presencial incluye bebidas y aperitivos.</p>',
  '/images/logos/Read The Fucking Room.png',
  '{
    "/images/talleres/read-the-fucking-room/photo_2025-04-15 19.19.35.jpeg",
    "/images/talleres/read-the-fucking-room/photo_2025-04-15 19.19.38.jpeg",
    "/images/talleres/read-the-fucking-room/photo_2025-04-15 19.19.39.jpeg",
    "/images/talleres/read-the-fucking-room/photo_2025-04-15 19.19.40.jpeg"
  }',
  '/videos/talleres/read-the-fucking-room/Read the room.m4v',
  '[
    {
      "id": "context",
      "title": "Contexto",
      "description": "Cómo leer el contexto en diferentes situaciones",
      "icon": "visibility"
    },
    {
      "id": "language",
      "title": "Lenguaje",
      "description": "El poder del lenguaje verbal y no verbal",
      "icon": "record_voice_over"
    },
    {
      "id": "presence",
      "title": "Presencia",
      "description": "Cómo desarrollar una presencia impactante",
      "icon": "person"
    }
  ]',
  false,
  NULL,
  '{
    "Material didáctico",
    "Certificado de participación",
    "Versión presencial: Bebidas y aperitivos",
    "Versión en línea: Acceso a grabación vía Vimeo"
  }',
  'Inscríbete ahora',
  '{
    "title": "Read The Fucking Room | The Full Boss Financial Experience",
    "description": "Taller sobre lectura de contexto, lenguaje y presencia con Jorge Fernández.",
    "keywords": ["lectura de contexto", "lenguaje corporal", "presencia", "comunicación efectiva"]
  }',
  true
);

-- Create table for workshop sessions
CREATE TABLE IF NOT EXISTS workshop_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL,
  available_spots integer NOT NULL,
  price numeric(10, 2) NOT NULL,
  is_online boolean DEFAULT false,
  vimeo_link text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workshop_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading workshop sessions (anyone can read active sessions)
CREATE POLICY "Anyone can read active workshop sessions"
  ON workshop_sessions
  FOR SELECT
  USING (active = true);

-- Create policy for authenticated users with admin role to manage workshop sessions
CREATE POLICY "Admins can manage workshop sessions"
  ON workshop_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at column
CREATE TRIGGER update_workshop_sessions_updated_at
BEFORE UPDATE ON workshop_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial workshop session data
INSERT INTO workshop_sessions (
  id,
  workshop_id,
  date,
  location,
  capacity,
  available_spots,
  price,
  is_online,
  vimeo_link,
  active
) VALUES 
-- The Dinner session
(
  'dinner-session-001',
  '25c456d1-1939-4e82-803c-4c2cca939264',
  '2025-06-15 20:00:00-06',
  'Restaurante La Mansión, Monterrey',
  15,
  8,
  3500,
  false,
  NULL,
  true
),
-- The Brunch session
(
  'brunch-session-001',
  '6e91a696-8ad8-43b0-abf1-908b1e5b3929',
  '2025-06-22 11:00:00-06',
  'Restaurante La Mansión, Monterrey',
  15,
  10,
  2800,
  false,
  NULL,
  true
),
-- Read The Fucking Room sessions
(
  'rtfr-session-001',
  '3cb9c062-ed99-4c80-941e-bf462648acf1',
  '2025-06-10 18:00:00-06',
  'Hotel NH Collection, Monterrey',
  30,
  15,
  2000,
  false,
  NULL,
  true
),
(
  'rtfr-session-002',
  '3cb9c062-ed99-4c80-941e-bf462648acf1',
  '2025-06-17 19:00:00-06',
  'Online via Zoom',
  100,
  85,
  1500,
  true,
  'https://vimeo.com/user/watch/xxx',
  true
);
