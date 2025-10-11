-- Add a monotonic counter for total quotes created
-- This counter should never decrease, even when quotes are deleted

-- Add column to settings table to track total quotes created
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS total_quotes_created INTEGER DEFAULT 0;

-- Create a function to increment the counter when a quote is created
CREATE OR REPLACE FUNCTION increment_total_quotes_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the counter for this business
  UPDATE settings
  SET total_quotes_created = COALESCE(total_quotes_created, 0) + 1
  WHERE business_id = NEW.business_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT on proposal table
DROP TRIGGER IF EXISTS trigger_increment_quotes_created ON proposal;

CREATE TRIGGER trigger_increment_quotes_created
AFTER INSERT ON proposal
FOR EACH ROW
EXECUTE FUNCTION increment_total_quotes_created();

-- Initialize the counter with current quote counts for existing users
UPDATE settings s
SET total_quotes_created = (
  SELECT COUNT(*)
  FROM proposal p
  WHERE p.business_id = s.business_id
)
WHERE total_quotes_created = 0 OR total_quotes_created IS NULL;
