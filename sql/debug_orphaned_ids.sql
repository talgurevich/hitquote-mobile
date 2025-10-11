-- Debug: Show exactly what IDs are considered orphaned

DO $$
DECLARE
  v_record RECORD;
BEGIN
  RAISE NOTICE '=== Checking tal.gurevich@gmail.com accounts ===';

  FOR v_record IN (
    SELECT
      au.id as auth_id,
      au.email,
      au.created_at,
      s.business_id as settings_id,
      s.business_email as settings_email,
      CASE WHEN s.business_id IS NULL THEN 'ORPHANED' ELSE 'HAS_SETTINGS' END as status
    FROM auth.users au
    LEFT JOIN settings s ON s.business_id = au.id
    WHERE au.email = 'tal.gurevich@gmail.com'
    ORDER BY au.created_at
  ) LOOP
    RAISE NOTICE 'Auth ID: %, Email: %, Created: %, Settings ID: %, Settings Email: %, Status: %',
      v_record.auth_id, v_record.email, v_record.created_at,
      v_record.settings_id, v_record.settings_email, v_record.status;
  END LOOP;
END $$;
