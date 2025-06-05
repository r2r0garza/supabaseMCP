/*
  # Create orders table

  1. New Tables:
    - `orders`: Tabla para almacenar las órdenes de reserva de talleres
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `workshop_id` (uuid, foreign key to workshops)
      - `session_id` (uuid, foreign key to workshop_sessions)
      - `payment_method` (text)
      - `payment_id` (text)
      - `status` (text)
      - `amount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security:
    - Enable RLS on `orders` table
    - Add policy for authenticated users to read their own orders
    - Add policy for admins to manage all orders
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create trigger to update the updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create policy for users to read their own orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can read their own orders'
  ) THEN
    CREATE POLICY "Users can read their own orders"
      ON orders
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policy for admins to manage all orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Admins can manage all orders'
  ) THEN
    CREATE POLICY "Admins can manage all orders"
      ON orders
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_session_id_idx ON orders(session_id);
CREATE INDEX IF NOT EXISTS orders_workshop_id_idx ON orders(workshop_id);
