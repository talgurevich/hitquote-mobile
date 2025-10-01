import { supabase } from './supabaseClient';

// Hardcoded approved emails (fallback when RLS blocks database access)
// This mirrors the approved emails that exist in the web app
const APPROVED_EMAILS = [
  'tal.gurevich@gmail.com',
  'moran.marmus@gmail.com',
  'demo@example.com',
  'test@example.com',
  // Apple TestFlight Review Demo Credentials
  'applereview@demo.com',
  'testflight@review.com',
  'demo@testflight.com',
  'review@apple.com',
  'demo@applereview.com',
  // Add other approved emails here as needed
];

// Check if email is approved for access
export async function isEmailApproved(email) {
  console.log('=== EMAIL APPROVAL CHECK STARTING ===');
  console.log('Input email:', email);
  console.log('Email type:', typeof email);

  if (!email) {
    console.log('No email provided - returning false');
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check demo user first (Apple TestFlight Review)
  console.log('Checking if demo email...');
  if (isDemoEmail(normalizedEmail)) {
    console.log('🍎 DEMO EMAIL DETECTED - ALLOWING ACCESS FOR APPLE REVIEW:', email);
    return true;
  }

  // Check admin first
  console.log('Checking if admin email...');
  if (isAdminEmail(normalizedEmail)) {
    console.log('✅ ADMIN EMAIL DETECTED - ALLOWING ACCESS:', email);
    return true;
  }

  // Check hardcoded list first (before database)
  console.log('Checking hardcoded approved emails list...');
  console.log('Hardcoded approved emails:', APPROVED_EMAILS);
  console.log('Email to check (normalized):', normalizedEmail);

  if (APPROVED_EMAILS.includes(normalizedEmail)) {
    console.log('✅ EMAIL FOUND IN HARDCODED LIST - ALLOWING ACCESS:', email);
    return true;
  }

  try {
    console.log('Attempting database query with RPC function...');

    // Use RPC function to bypass RLS - create a public function that checks approved emails
    const { data, error } = await supabase
      .rpc('check_email_approval', {
        email_to_check: normalizedEmail
      });

    if (!error && data === true) {
      console.log('✅ Database RPC check successful - EMAIL APPROVED');
      return true;
    }

    // Fallback to direct query if RPC doesn't exist
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('RPC function not found, trying direct query...');

      const { data: directData, error: directError } = await supabase
        .from('approved_emails')
        .select('status')
        .eq('email', normalizedEmail)
        .eq('status', 'approved')
        .maybeSingle();

      if (!directError && directData) {
        console.log('✅ Direct database query successful - EMAIL APPROVED');
        return true;
      }

      if (directError) {
        console.log('⚠️ Direct query failed:', directError.message);
      }
    }

    if (error && !error.message.includes('function')) {
      console.log('❌ RPC query error:', error.message);
    }

  } catch (error) {
    console.error('❌ Exception in database check:', error);
  }

  // For development/testing - temporarily allow all @example.com emails
  if (normalizedEmail.endsWith('@example.com')) {
    console.log('🧪 TEST EMAIL DETECTED - ALLOWING ACCESS:', email);
    return true;
  }

  console.log('=== FINAL RESULT: ❌ DENIED - Email not in any approved list ===');
  return false;
}


// Check if email is admin (always approved)
export function isAdminEmail(email) {
  return email.toLowerCase().trim() === 'tal.gurevich@gmail.com';
}

// Check if email is demo user for Apple TestFlight Review
export function isDemoEmail(email) {
  const demoEmails = [
    'applereview@demo.com',
    'testflight@review.com',
    'demo@testflight.com',
    'review@apple.com',
    'demo@applereview.com'
  ];
  return demoEmails.includes(email.toLowerCase().trim());
}