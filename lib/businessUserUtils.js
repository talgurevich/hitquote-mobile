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
      .eq('supabase_auth_id', authUserId)
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

  // Check if this is a demo user - return a demo business ID
  if (authUserId === 'demo-user-apple-review' ||
      userEmail === 'applereview@demo.com' ||
      session.user.user_metadata?.provider === 'demo') {
    console.log('🍎 Demo user detected, returning demo business ID');
    return 'demo-business-id';
  }

  console.log('=== BUSINESS USER VALIDATION DEBUG ===');
  console.log('Auth User ID:', authUserId);
  console.log('User Email:', userEmail);

  // Try to get existing profile and business
  let { userProfileId, businessId } = await getUserProfileAndBusiness(authUserId);
  console.log('Existing profile ID:', userProfileId);
  console.log('Existing business ID:', businessId);

  // COMPATIBILITY: Also ensure user exists in 'users' table for web app compatibility
  let legacyUserId = null;
  try {
    const { data: legacyUser, error: legacyError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (!legacyUser && userEmail) {
      // Create legacy user record for web app compatibility
      const { data: newLegacyUser, error: createLegacyError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: userEmail,
          name: userName,
          created_at: new Date().toISOString()
        })
        .select('id')
        .maybeSingle();

      if (!createLegacyError && newLegacyUser) {
        legacyUserId = newLegacyUser.id;
        console.log('Created legacy user record:', legacyUserId);
      }
    } else if (legacyUser) {
      legacyUserId = legacyUser.id;
      console.log('Found existing legacy user:', legacyUserId);
    }
  } catch (error) {
    console.error('Error handling legacy users table:', error);
  }

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
        // Update the existing profile with the new supabase_auth_id
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ supabase_auth_id: authUserId })
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
        const { data: newProfile, error: profileError} = await supabase
          .from('user_profiles')
          .insert({
            supabase_auth_id: authUserId,
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
        console.error('Error creating business_settings:', settingsError);
        // Don't fail if settings creation fails
      } else {
        console.log('✅ Created business_settings record');
      }

      // ALSO create record in 'settings' table for mobile app compatibility
      const firstOfMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
      const { error: legacySettingsError } = await supabase
        .from('settings')
        .insert({
          business_id: businessId,
          business_name: `${userName}'s Business`,
          business_email: userEmail,
          header_color: '#FDDC33',
          pdf_template: 'template1',
          monthly_quotes_created: 0,
          total_quotes_created: 0,
          monthly_counter_reset_date: firstOfMonth
        });

      if (legacySettingsError) {
        console.error('Error creating settings (legacy):', legacySettingsError);
      } else {
        console.log('✅ Created settings record (legacy)');
      }

      console.log('Created new user profile and business:', { userProfileId, businessId });
    } catch (error) {
      console.error('Error in user/business creation process:', error);
      return null;
    }
  }

  // If we have a user profile but no business, create one
  if (userProfileId && !businessId) {
    console.log('User profile exists but no business found, creating business...');

    try {
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
      } else {
        businessId = newBusiness.id;
        console.log('Created business:', businessId);

        // Create business membership
        await supabase
          .from('business_members')
          .insert({
            business_id: businessId,
            user_id: userProfileId,
            role: 'owner'
          });

        // Create business settings
        await supabase
          .from('business_settings')
          .insert({
            business_id: businessId,
            vat_rate: 18.00,
            default_payment_terms: 'מזומן / המחאה / העברה בנקאית / שוטף +30'
          });

        // ALSO create record in 'settings' table for mobile app compatibility
        const firstOfMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
        await supabase
          .from('settings')
          .insert({
            business_id: businessId,
            business_name: `${userName}'s Business`,
            business_email: userEmail,
            header_color: '#FDDC33',
            pdf_template: 'template1',
            monthly_quotes_created: 0,
            total_quotes_created: 0,
            monthly_counter_reset_date: firstOfMonth
          });
      }
    } catch (error) {
      console.error('Error creating business for existing user:', error);
    }
  }

  // For ALL users, ensure they have a settings record (legacy table)
  if (businessId) {
    try {
      console.log('🔍 Checking if settings record exists for business:', businessId);

      // Check for ALL settings records (might be duplicates)
      const { data: allSettings, error: checkSettingsError } = await supabase
        .from('settings')
        .select('id')
        .eq('business_id', businessId);

      console.log('Settings check result:', {
        settingsCount: allSettings?.length || 0,
        checkError: checkSettingsError
      });

      if (checkSettingsError) {
        console.error('❌ Error checking settings:', checkSettingsError);
        return businessId;
      }

      // If duplicates exist, delete all but one
      if (allSettings && allSettings.length > 1) {
        console.log(`⚠️ Found ${allSettings.length} duplicate settings, cleaning up...`);

        // Keep the first one, delete the rest
        const keepId = allSettings[0].id;
        const deleteIds = allSettings.slice(1).map(s => s.id);

        for (const id of deleteIds) {
          await supabase.from('settings').delete().eq('id', id);
        }

        console.log(`✅ Deleted ${deleteIds.length} duplicate settings`);
      }

      // Now check again for single record
      const { data: existingSettings, error: singleCheckError } = await supabase
        .from('settings')
        .select('id, monthly_quotes_created, total_quotes_created')
        .eq('business_id', businessId)
        .limit(1)
        .maybeSingle();

      if (!existingSettings) {
        console.log('⚠️ No settings record found, creating one...');

        // Get business info for settings
        const { data: businessInfo } = await supabase
          .from('businesses')
          .select('business_name, business_email')
          .eq('id', businessId)
          .single();

        console.log('Business info for settings:', businessInfo);

        // Count existing quotes for this business to backfill counters
        const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01';

        const { count: totalCount } = await supabase
          .from('proposal')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId);

        const { count: monthlyCount } = await supabase
          .from('proposal')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('created_at', currentMonth);

        console.log('Backfilling counters with:', { totalCount, monthlyCount });

        // Simple insert
        const { error: createSettingsError } = await supabase
          .from('settings')
          .insert({
            business_id: businessId,
            business_name: businessInfo?.business_name || `${userName}'s Business`,
            business_email: businessInfo?.business_email || userEmail,
            header_color: '#FDDC33',
            pdf_template: 'template1',
            monthly_quotes_created: monthlyCount || 0,
            total_quotes_created: totalCount || 0,
            monthly_counter_reset_date: currentMonth
          });

        if (createSettingsError) {
          console.error('❌ Error creating settings:', createSettingsError);
        } else {
          console.log('✅ Created settings record with backfilled counters');
        }
      } else {
        console.log('✅ Settings record exists with counters:', {
          monthly: existingSettings.monthly_quotes_created,
          total: existingSettings.total_quotes_created
        });
      }
    } catch (error) {
      console.error('❌ Error in settings check/create:', error);
    }
  }

  // Store in global for compatibility
  validateSessionAndGetBusinessUserId._cachedLegacyUserId = legacyUserId;

  // Return just businessId for backward compatibility
  return businessId;
}

/**
 * Gets the cached legacy user ID from the last validateSessionAndGetBusinessUserId call
 */
export function getCachedLegacyUserId() {
  return validateSessionAndGetBusinessUserId._cachedLegacyUserId;
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