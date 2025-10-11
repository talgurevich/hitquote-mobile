-- Delete specific orphaned user: info@wallaura.art
-- This user exists in auth.users but not in settings table

-- First, verify the user exists and is orphaned
DO $$
DECLARE
  v_user_id uuid;
  v_settings_exists boolean;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'info@wallaura.art';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User info@wallaura.art not found in auth.users';
    RETURN;
  END IF;

  -- Check if settings record exists
  SELECT EXISTS(
    SELECT 1 FROM settings WHERE business_id = v_user_id
  ) INTO v_settings_exists;

  IF v_settings_exists THEN
    RAISE NOTICE 'User has settings record - NOT an orphaned user. Aborting.';
    RETURN;
  END IF;

  -- User is orphaned - safe to delete
  RAISE NOTICE 'Deleting orphaned user: % (ID: %)', 'info@wallaura.art', v_user_id;

  DELETE FROM auth.users WHERE id = v_user_id;

  RAISE NOTICE 'Successfully deleted orphaned user';
END $$;
