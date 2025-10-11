-- Create monthly_quote_counters table for persistent quote counting
-- This table maintains an increment-only counter that never decreases when quotes are deleted

CREATE TABLE IF NOT EXISTS monthly_quote_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  quote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one counter per user per month
  UNIQUE(user_id, year, month)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_monthly_quote_counters_user_year_month
  ON monthly_quote_counters(user_id, year, month);

-- Add RLS policies (adjust based on your security requirements)
ALTER TABLE monthly_quote_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own counters
CREATE POLICY "Users can read their own counters"
  ON monthly_quote_counters
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text IN (
      SELECT id::text FROM users WHERE auth_user_id::text = auth.uid()::text
    )
  );

-- Policy: Users can insert their own counters
CREATE POLICY "Users can insert their own counters"
  ON monthly_quote_counters
  FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text IN (
      SELECT id::text FROM users WHERE auth_user_id::text = auth.uid()::text
    )
  );

-- Policy: Users can update their own counters
CREATE POLICY "Users can update their own counters"
  ON monthly_quote_counters
  FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text IN (
      SELECT id::text FROM users WHERE auth_user_id::text = auth.uid()::text
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_quote_counters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER update_monthly_quote_counters_timestamp
  BEFORE UPDATE ON monthly_quote_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_quote_counters_updated_at();
