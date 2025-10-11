-- Check product user_ids vs tal's legacy user ID

-- 1. Get tal's legacy user ID from users table
SELECT id as legacy_user_id, auth_user_id, email, name
FROM users
WHERE auth_user_id = '58e079d4-c543-4485-9230-820a5715dbb4';

-- 2. Show recent products and their user_ids
SELECT id, name, user_id, created_at
FROM product
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count products by user_id
SELECT user_id, COUNT(*) as product_count
FROM product
GROUP BY user_id
ORDER BY product_count DESC;

-- 4. Check if products exist for tal's legacy user
SELECT COUNT(*) as tal_product_count
FROM product
WHERE user_id IN (
  SELECT id FROM users WHERE auth_user_id = '58e079d4-c543-4485-9230-820a5715dbb4'
);
