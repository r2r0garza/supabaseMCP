/*
  # Create workshops table - Part 1: Tables and Triggers

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
    - `workshop_sessions`
      - `id` (uuid, primary key)
      - `workshop_id` (uuid, foreign key)
      - `date` (timestamptz)
      - `location` (text)
      - `capacity` (integer)
      - `available_spots` (integer)
      - `price` (numeric)
      - `is_online` (boolean)
      - `vimeo_link` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
*/

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create workshops table
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

-- Create trigger to update the updated_at column for workshops
CREATE TRIGGER update_workshops_updated_at
BEFORE UPDATE ON workshops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create workshop sessions table
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

-- Create trigger to update the updated_at column for workshop_sessions
CREATE TRIGGER update_workshop_sessions_updated_at
BEFORE UPDATE ON workshop_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
