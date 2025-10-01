-- Create a public function to check email approval that bypasses RLS
-- This function runs with SECURITY DEFINER to use the function owner's privileges

CREATE OR REPLACE FUNCTION public.check_email_approval(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize the email
  email_to_check := LOWER(TRIM(email_to_check));

  -- Check if the email exists with approved status
  RETURN EXISTS (
    SELECT 1
    FROM public.approved_emails
    WHERE LOWER(TRIM(email)) = email_to_check
      AND status = 'approved'
  );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_email_approval(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_approval(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_email_approval(text) IS 'Check if an email is approved for access, bypassing RLS policies';