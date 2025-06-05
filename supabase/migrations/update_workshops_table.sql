/*
  # Update workshops table

  1. Changes to workshops table:
    - Add `slug` (text, unique)
    - Add `short_description` (text)
    - Add `full_description` (text)
    - Add `image_url` (text)
    - Add `gallery_images` (text[])
    - Add `video_url` (text)
    - Add `topics` (jsonb)
    - Add `is_exclusive` (boolean)
    - Add `exclusivity_note` (text)
    - Add `includes` (text[])
    - Add `cta_text` (text)
    - Add `metadata` (jsonb)
    - Add `active` (boolean)
    - Rename `description` to `short_description` (if not already renamed)
*/

-- Create function to update the updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add new columns to workshops table
DO $$
BEGIN
  -- Add slug column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'slug'
  ) THEN
    ALTER TABLE workshops ADD COLUMN slug text UNIQUE;
    -- Update existing rows with a slug based on name
    UPDATE workshops SET slug = LOWER(REPLACE(name, ' ', '-'));
    -- Make slug NOT NULL after populating it
    ALTER TABLE workshops ALTER COLUMN slug SET NOT NULL;
  END IF;

  -- Add full_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'full_description'
  ) THEN
    ALTER TABLE workshops ADD COLUMN full_description text;
    -- Copy description to full_description for existing rows
    UPDATE workshops SET full_description = description;
    -- Make full_description NOT NULL after populating it
    ALTER TABLE workshops ALTER COLUMN full_description SET NOT NULL;
  END IF;

  -- Add short_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE workshops ADD COLUMN short_description text;
    -- Copy description to short_description for existing rows
    UPDATE workshops SET short_description = description;
    -- Make short_description NOT NULL after populating it
    ALTER TABLE workshops ALTER COLUMN short_description SET NOT NULL;
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE workshops ADD COLUMN image_url text DEFAULT '/images/default-workshop.png';
    -- Make image_url NOT NULL after setting default
    ALTER TABLE workshops ALTER COLUMN image_url SET NOT NULL;
  END IF;

  -- Add gallery_images column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE workshops ADD COLUMN gallery_images text[] DEFAULT '{}';
  END IF;

  -- Add video_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE workshops ADD COLUMN video_url text;
  END IF;

  -- Add topics column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'topics'
  ) THEN
    ALTER TABLE workshops ADD COLUMN topics jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add is_exclusive column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'is_exclusive'
  ) THEN
    ALTER TABLE workshops ADD COLUMN is_exclusive boolean DEFAULT false;
  END IF;

  -- Add exclusivity_note column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'exclusivity_note'
  ) THEN
    ALTER TABLE workshops ADD COLUMN exclusivity_note text;
  END IF;

  -- Add includes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'includes'
  ) THEN
    ALTER TABLE workshops ADD COLUMN includes text[] DEFAULT '{}';
  END IF;

  -- Add cta_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'cta_text'
  ) THEN
    ALTER TABLE workshops ADD COLUMN cta_text text DEFAULT 'Reserva tu lugar';
    -- Make cta_text NOT NULL after setting default
    ALTER TABLE workshops ALTER COLUMN cta_text SET NOT NULL;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE workshops ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshops' AND column_name = 'active'
  ) THEN
    ALTER TABLE workshops ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Create workshop_sessions table if it doesn't exist
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

-- Enable Row Level Security on workshop_sessions if not already enabled
ALTER TABLE workshop_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading workshop sessions (anyone can read active sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workshop_sessions' AND policyname = 'Anyone can read active workshop sessions'
  ) THEN
    CREATE POLICY "Anyone can read active workshop sessions"
      ON workshop_sessions
      FOR SELECT
      USING (active = true);
  END IF;
END $$;

-- Create policy for authenticated users with admin role to manage workshop sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workshop_sessions' AND policyname = 'Admins can manage workshop sessions'
  ) THEN
    CREATE POLICY "Admins can manage workshop sessions"
      ON workshop_sessions
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Create trigger to update the updated_at column for workshop_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_workshop_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_workshop_sessions_updated_at
    BEFORE UPDATE ON workshop_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create policy for reading workshops (anyone can read active workshops)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workshops' AND policyname = 'Anyone can read active workshops'
  ) THEN
    CREATE POLICY "Anyone can read active workshops"
      ON workshops
      FOR SELECT
      USING (active = true);
  END IF;
END $$;

-- Create policy for authenticated users with admin role to manage workshops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workshops' AND policyname = 'Admins can manage workshops'
  ) THEN
    CREATE POLICY "Admins can manage workshops"
      ON workshops
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Insert initial workshop data if not already present
DO $$
BEGIN
  -- The Dinner
  IF NOT EXISTS (SELECT 1 FROM workshops WHERE slug = 'the-dinner') THEN
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
    ) VALUES (
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
    );
  END IF;

  -- The Brunch
  IF NOT EXISTS (SELECT 1 FROM workshops WHERE slug = 'the-brunch') THEN
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
    ) VALUES (
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
    );
  END IF;

  -- Read The Fucking Room
  IF NOT EXISTS (SELECT 1 FROM workshops WHERE slug = 'read-the-fucking-room') THEN
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
    ) VALUES (
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
  END IF;
END $$;

-- Insert initial workshop session data if not already present
DO $$
BEGIN
  -- The Dinner session
  IF NOT EXISTS (SELECT 1 FROM workshop_sessions WHERE workshop_id = '25c456d1-1939-4e82-803c-4c2cca939264' AND date = '2025-06-15 20:00:00-06') THEN
    INSERT INTO workshop_sessions (
      workshop_id,
      date,
      location,
      capacity,
      available_spots,
      price,
      is_online,
      vimeo_link,
      active
    ) VALUES (
      '25c456d1-1939-4e82-803c-4c2cca939264',
      '2025-06-15 20:00:00-06',
      'Restaurante La Mansión, Monterrey',
      15,
      8,
      3500,
      false,
      NULL,
      true
    );
  END IF;

  -- The Brunch session
  IF NOT EXISTS (SELECT 1 FROM workshop_sessions WHERE workshop_id = '6e91a696-8ad8-43b0-abf1-908b1e5b3929' AND date = '2025-06-22 11:00:00-06') THEN
    INSERT INTO workshop_sessions (
      workshop_id,
      date,
      location,
      capacity,
      available_spots,
      price,
      is_online,
      vimeo_link,
      active
    ) VALUES (
      '6e91a696-8ad8-43b0-abf1-908b1e5b3929',
      '2025-06-22 11:00:00-06',
      'Restaurante La Mansión, Monterrey',
      15,
      10,
      2800,
      false,
      NULL,
      true
    );
  END IF;

  -- Read The Fucking Room sessions
  IF NOT EXISTS (SELECT 1 FROM workshop_sessions WHERE workshop_id = '3cb9c062-ed99-4c80-941e-bf462648acf1' AND date = '2025-06-10 18:00:00-06') THEN
    INSERT INTO workshop_sessions (
      workshop_id,
      date,
      location,
      capacity,
      available_spots,
      price,
      is_online,
      vimeo_link,
      active
    ) VALUES (
      '3cb9c062-ed99-4c80-941e-bf462648acf1',
      '2025-06-10 18:00:00-06',
      'Hotel NH Collection, Monterrey',
      30,
      15,
      2000,
      false,
      NULL,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM workshop_sessions WHERE workshop_id = '3cb9c062-ed99-4c80-941e-bf462648acf1' AND date = '2025-06-17 19:00:00-06') THEN
    INSERT INTO workshop_sessions (
      workshop_id,
      date,
      location,
      capacity,
      available_spots,
      price,
      is_online,
      vimeo_link,
      active
    ) VALUES (
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
  END IF;
END $$;
