import { supabase } from './supabaseClient';

/**
 * Gets the user profile ID and business ID for the authenticated user
 * Works with the new RLS-enabled business architecture
 */
export async function getUserProfileAndBusiness(authUserId) {
  try {
    console.log('Looking for user profile with auth_user_id:', authUserId);

    // First, get the user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      console.error('Profile error details:', JSON.stringify(profileError, null, 2));
      return { userProfileId: null, businessId: null };
    }

    if (!userProfile) {
      console.log('No user profile found for auth user:', authUserId);
      return { userProfileId: null, businessId: null };
    }

    console.log('Found user profile:', userProfile.id);

    // Get the business ID for this user (first business they're a member of)
    const { data: businessMember, error: memberError } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching business membership:', memberError);
      console.error('Member error details:', JSON.stringify(memberError, null, 2));
      return { userProfileId: userProfile.id, businessId: null };
    }

    console.log('Business member data:', businessMember);

    return {
      userProfileId: userProfile.id,
      businessId: businessMember?.business_id || null
    };
  } catch (error) {
    console.error('Error in getUserProfileAndBusiness:', error);
    return { userProfileId: null, businessId: null };
  }
}

/**
 * Gets the business ID for the authenticated user
 * This is the main function used throughout the app
 */
export async function getBusinessUserId(authUserId) {
  const { businessId } = await getUserProfileAndBusiness(authUserId);
  return businessId;
}

/**
 * Validates session and gets business ID with auto-creation for new users
 */
export async function validateSessionAndGetBusinessUserId(session) {
  if (!session?.user?.id) {
    throw new Error('Invalid session');
  }

  const authUserId = session.user.id;
  const userEmail = session.user.email;
  const userName = session.user.name || session.user.email;

  console.log('=== BUSINESS USER VALIDATION DEBUG ===');
  console.log('Auth User ID:', authUserId);
  console.log('User Email:', userEmail);

  // Try to get existing profile and business
  let { userProfileId, businessId } = await getUserProfileAndBusiness(authUserId);
  console.log('Existing profile ID:', userProfileId);
  console.log('Existing business ID:', businessId);

  // If no user profile exists, create the complete business setup
  if (!userProfileId) {
    console.log('Creating new user profile and business for:', userEmail);

    try {
      // First check if a profile exists with this email but different auth_user_id
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, auth_user_id')
        .eq('email', userEmail)
        .maybeSingle();

      if (existingProfile && existingProfile.auth_user_id !== authUserId) {
        console.log('Found existing profile with different auth_user_id, updating...');
        // Update the existing profile with the new auth_user_id
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ auth_user_id: authUserId })
          .eq('email', userEmail)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating existing profile:', updateError);
          return null;
        }

        userProfileId = updatedProfile.id;
        console.log('Updated existing profile with new auth_user_id:', userProfileId);
      } else {
        // Create new user profile
        console.log('Attempting to create user profile...');
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            auth_user_id: authUserId,
            email: userEmail,
            display_name: userName
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          console.error('Profile error details:', JSON.stringify(profileError, null, 2));
          return null;
        }

        userProfileId = newProfile.id;
        console.log('Created user profile with ID:', userProfileId);
      }

      // Create business
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: userProfileId,
          business_name: `${userName}'s Business`,
          business_email: userEmail,
          vat_rate: 18.00,
          default_payment_terms: 'מזומן / המחאה / העברה בנקאית / שוטף +30'
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
        return null;
      }

      businessId = newBusiness.id;

      // Create business membership
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: businessId,
          user_id: userProfileId,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error creating business membership:', memberError);
        // Don't fail if membership creation fails - the business exists
      }

      // Create business settings
      const { error: settingsError } = await supabase
        .from('business_settings')
        .insert({
          business_id: businessId,
          vat_rate: 18.00,
          default_payment_terms: 'מזומן / המחאה / העברה בנקאית / שוטף +30'
        });

      if (settingsError) {
        console.error('Error creating business settings:', settingsError);
        // Don't fail if settings creation fails
      }

      console.log('Created new user profile and business:', { userProfileId, businessId });
    } catch (error) {
      console.error('Error in user/business creation process:', error);
      return null;
    }
  }

  // If we have a user profile but no business, check if they have an existing business
  if (userProfileId && !businessId) {
    console.log('User profile exists but no business found, checking for existing business...');

    // Re-check for business membership
    const { data: businessMember, error: memberError } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userProfileId)
      .limit(1)
      .maybeSingle();

    if (!memberError && businessMember) {
      businessId = businessMember.business_id;
      console.log('Found existing business:', businessId);
    } else {
      console.log('No business found, user profile exists but needs business setup');
      // This case should be handled by creating a business if needed
    }
  }

  return businessId;
}

/**
 * Gets business settings for the current user's business
 */
export async function getBusinessSettings(businessId) {
  if (!businessId) return null;

  try {
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching business settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Error in getBusinessSettings:', error);
    return null;
  }
}