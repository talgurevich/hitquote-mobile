-- Final cleanup: Delete both accounts and check Supabase auth config

-- First show what we're deleting
SELECT 'BEFORE DELETE' as status, id, email, confirmed_at, email_confirmed_at
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';

-- Delete upgrade requests
DELETE FROM upgrade_requests
WHERE reviewed_by IN (
  SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com'
);

-- Delete the accounts
DELETE FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';

-- Verify they're gone
SELECT 'AFTER DELETE' as status, COUNT(*) as count
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';

-- Check auth config
SELECT
  name,
  value
FROM auth.config
WHERE name IN ('DISABLE_SIGNUP', 'MAILER_AUTOCONFIRM', 'EXTERNAL_EMAIL_ENABLED');
