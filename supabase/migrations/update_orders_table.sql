/*
  # Update orders table

  1. Changes to orders table:
    - Add `session_id` (uuid, foreign key to workshop_sessions)
*/

-- Add session_id column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN session_id uuid REFERENCES workshop_sessions(id) ON DELETE CASCADE;
    -- No establecemos NOT NULL por ahora para permitir datos existentes
  END IF;
END $$;

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS orders_session_id_idx ON orders(session_id);
