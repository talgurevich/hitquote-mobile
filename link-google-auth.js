// Script to link Google authentication for existing users
// Run with: node link-google-auth.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exfzzadoqlumijmvgwch.supabase.co';
// You need to get the SERVICE_ROLE_KEY from Supabase Dashboard > Settings > API
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function linkGoogleAccount(email, googleId) {
  console.log(`Linking Google account for ${email}...`);

  try {
    // Get user by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      throw getUserError;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    console.log(`Found user: ${user.id}`);

    // Generate Google-derived password
    const googlePassword = `google_${googleId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;

    console.log(`Setting Google password for ${email}...`);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: googlePassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully linked Google account for ${email}`);
    console.log(`   Google ID: ${googleId}`);
    console.log(`   Password: ${googlePassword}`);

  } catch (error) {
    console.error(`❌ Error linking Google account for ${email}:`, error.message);
  }
}

// Link accounts for Tal and Moran
async function main() {
  console.log('Starting Google account linking...\n');

  // Tal's account
  await linkGoogleAccount('tal.gurevich@gmail.com', '100019258193212857278');

  console.log('\n');

  // Moran's account - Google ID will be shown when they try to sign in
  // For now, just document it
  console.log('⚠️  For Moran (moran.marmus@gmail.com):');
  console.log('   Run this script again after getting the Google ID from logs');
  console.log('   Or have Moran try Google Sign-In and copy the Google ID from the error');

  console.log('\nDone!');
}

main();
