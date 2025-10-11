-- Create function to auto-create user_profile when auth.users entry is created
CREATE OR REPLACE FUNCTION create_user_profile_for_new_auth_user()
RETURNS TRIGGER AS $FUNC$
BEGIN
  INSERT INTO user_profiles (supabase_auth_id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (supabase_auth_id) DO NOTHING;

  RETURN NEW;
END;
$FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS create_profile_on_auth_signup ON auth.users;

-- Create trigger
CREATE TRIGGER create_profile_on_auth_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_for_new_auth_user();

-- Verify
SELECT 'User profile trigger created successfully!' as status;
