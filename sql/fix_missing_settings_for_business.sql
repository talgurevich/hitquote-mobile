-- Check if settings record exists for the business
SELECT
  b.id as business_id,
  b.business_name,
  s.id as settings_id,
  s.monthly_quotes_created,
  s.total_quotes_created
FROM businesses b
LEFT JOIN settings s ON s.business_id = b.id
WHERE b.id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';

-- Create settings record if it doesn't exist
INSERT INTO settings (
  business_id,
  business_name,
  business_email,
  header_color,
  pdf_template,
  monthly_quotes_created,
  total_quotes_created,
  monthly_counter_reset_date
)
SELECT
  b.id,
  b.business_name,
  b.business_email,
  '#FDDC33',
  1,
  0,
  0,
  DATE_TRUNC('month', CURRENT_DATE)::DATE
FROM businesses b
WHERE b.id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a'
  AND NOT EXISTS (
    SELECT 1 FROM settings WHERE business_id = b.id
  );

-- Verify the settings record was created
SELECT
  b.id as business_id,
  b.business_name,
  s.id as settings_id,
  s.monthly_quotes_created,
  s.total_quotes_created
FROM businesses b
LEFT JOIN settings s ON s.business_id = b.id
WHERE b.id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';
