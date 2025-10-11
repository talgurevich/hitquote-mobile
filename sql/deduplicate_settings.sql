-- Remove duplicate settings rows, keeping only one per business_id
-- This fixes the issue where multiple settings rows were created for the same business

WITH numbered_rows AS (
  SELECT
    id,
    business_id,
    ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at ASC NULLS LAST, id ASC) as row_num
  FROM settings
)
DELETE FROM settings
WHERE id IN (
  SELECT id
  FROM numbered_rows
  WHERE row_num > 1
);

-- Verify deduplication - should show only one row per business_id
SELECT business_id, COUNT(*) as count
FROM settings
GROUP BY business_id
HAVING COUNT(*) > 1;
