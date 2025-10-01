import { supabase } from './supabaseClient';

/**
 * Helper function to execute queries with RLS error handling
 * If RLS blocks the query, returns empty data instead of throwing
 */
export async function safeQuery(queryBuilder, fallbackData = null) {
  try {
    const { data, error } = await queryBuilder;

    if (error) {
      // Log ALL errors for debugging
      console.log('🔴 QUERY ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Check if this is an RLS error
      if (
        error.message?.includes('row') ||
        error.message?.includes('RLS') ||
        error.message?.includes('policy') ||
        error.code === 'PGRST301' ||
        error.code === '42501' // PostgreSQL insufficient privilege error
      ) {
        console.log('🔒 RLS blocked query, returning fallback data');
        return { data: fallbackData, error: null, rlsBlocked: true };
      }

      // For other errors, log but don't throw
      console.error('❌ Query error (non-RLS):', error);
      return { data: fallbackData, error };
    }

    // Log successful data retrieval
    if (data) {
      console.log('✅ Query successful, retrieved', Array.isArray(data) ? data.length : 1, 'records');
    }

    return { data, error: null };
  } catch (error) {
    console.error('💥 Unexpected error in safeQuery:', error);
    return { data: fallbackData, error };
  }
}

/**
 * Helper to handle array queries with RLS
 */
export async function safeArrayQuery(queryBuilder) {
  const result = await safeQuery(queryBuilder, []);
  return {
    data: result.data || [],
    error: result.error,
    rlsBlocked: result.rlsBlocked
  };
}

/**
 * Helper to handle single record queries with RLS
 */
export async function safeSingleQuery(queryBuilder) {
  const result = await safeQuery(queryBuilder, null);
  return {
    data: result.data,
    error: result.error,
    rlsBlocked: result.rlsBlocked
  };
}

/**
 * Helper to get the correct user ID for queries
 * Tries multiple approaches to ensure queries work with RLS
 */
export async function getUserIdForQuery(session) {
  if (!session?.user?.id) {
    return null;
  }

  // Try to get the business user ID first
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (user?.id) {
      return user.id;
    }
  } catch (error) {
    console.log('Could not get business user ID, using auth ID');
  }

  // Fallback to auth user ID
  return session.user.id;
}

/**
 * Helper to build a query with multiple user ID strategies
 * This helps when the user_id field might reference either auth or business user IDs
 */
export function buildFlexibleUserQuery(table, session) {
  if (!session?.user?.id) {
    throw new Error('No session available for query');
  }

  // Build a query that can match either auth user ID or business user ID
  const authUserId = session.user.id;
  const email = session.user.email;

  // This creates an OR condition for user matching
  return supabase
    .from(table)
    .select('*')
    .or(`user_id.eq.${authUserId},user_id.in.(select id from users where auth_user_id='${authUserId}' or email='${email}')`);
}