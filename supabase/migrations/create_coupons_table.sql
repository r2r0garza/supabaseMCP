/*
  # Create Coupons Table

  1. New Table
    - `coupons`
      - `id` (uuid, primary key) - Unique identifier for the coupon
      - `name` (text) - Display name/title of the coupon
      - `code` (text, unique) - The unique code users enter (e.g., "SAVE15", "WELCOME20")
      - `discount_type` (text) - Either "percentage" or "fixed_amount"
      - `discount_value` (decimal) - The discount amount (15 for 15%, or 50 for $50 off)
      - `max_discount_amount` (decimal, optional) - Maximum discount cap for percentage coupons
      - `min_order_amount` (decimal, optional) - Minimum purchase required to use coupon
      - `usage_limit` (integer, optional) - Total number of times coupon can be used
      - `usage_limit_per_user` (integer, optional) - How many times each user can use it
      - `usage_count` (integer, default 0) - Current usage count
      - `start_date` (timestamptz) - When coupon becomes active
      - `end_date` (timestamptz, optional) - When coupon expires
      - `is_active` (boolean, default true) - Whether coupon is currently active
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on the table
    - Add policies for appropriate access control

  3. Indexes
    - Index on code for fast lookups
    - Index on is_active and dates for filtering active coupons
*/

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount > 0),
  min_order_amount DECIMAL(10,2) CHECK (min_order_amount >= 0),
  usage_limit INTEGER CHECK (usage_limit > 0),
  usage_limit_per_user INTEGER CHECK (usage_limit_per_user > 0),
  usage_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT end_date_after_start_date CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT usage_count_within_limit CHECK (usage_limit IS NULL OR usage_count <= usage_limit)
);

-- Create indexes for better performance
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_dates ON coupons(start_date, end_date);
CREATE INDEX idx_coupons_active_dates ON coupons(is_active, start_date, end_date) WHERE is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for coupons table
-- Allow anyone to read active, valid coupons by code
CREATE POLICY "Anyone can read active coupons by code"
  ON coupons
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date > now())
  );

-- Only authenticated users can read all coupon details (for admin purposes)
CREATE POLICY "Authenticated users can read all coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert, update, delete coupons (admin operations)
CREATE POLICY "Service role can manage coupons"
  ON coupons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert some example coupons
INSERT INTO coupons (name, code, discount_type, discount_value, min_order_amount, usage_limit, end_date) VALUES
  ('Welcome Discount', 'WELCOME15', 'percentage', 15.00, 50.00, 100, now() + interval '30 days'),
  ('First Time Customer', 'FIRST20', 'percentage', 20.00, 100.00, 50, now() + interval '60 days'),
  ('Holiday Special', 'HOLIDAY50', 'fixed_amount', 50.00, 200.00, 200, now() + interval '7 days'),
  ('VIP Discount', 'VIP25', 'percentage', 25.00, NULL, NULL, NULL)
ON CONFLICT (code) DO NOTHING; 