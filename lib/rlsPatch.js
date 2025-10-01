/**
 * RLS Patch Script - Updates all queries to be RLS-safe
 * This file contains the modifications needed to make all queries work with RLS enabled
 */

export const RLS_UPDATES = {
  // Update loadQuotes to handle RLS
  loadQuotes: `
    // Wrap the query with safeArrayQuery
    const result = await safeArrayQuery(
      quotesQuery.order('created_at', { ascending: false })
    );
    const quotesWithCustomers = result.data || [];
  `,

  // Update loadProducts to handle RLS
  loadProducts: `
    const result = await safeArrayQuery(
      supabase
        .from('product')
        .select('id, category, name, unit_label, base_price, notes, options')
        .eq('user_id', businessUserId)
        .order('name', { ascending: true })
    );
    const productsData = result.data || [];
  `,

  // Update loadCustomers to handle RLS
  loadCustomers: `
    const result = await safeArrayQuery(
      supabase
        .from('customer')
        .select('id, name, email, phone, address, created_at')
        .eq('user_id', businessUserId)
        .order('name', { ascending: true })
    );
    const customersData = result.data || [];
  `,

  // Update settings queries to handle RLS
  loadSettings: `
    const result = await safeSingleQuery(
      supabase
        .from('settings')
        .select('business_name, business_email, business_phone, business_address, business_license, logo_url, header_color')
        .eq('user_id', businessUserId)
        .maybeSingle()
    );
    const businessData = result.data;
  `
};

// Function to test if RLS is blocking queries
export async function testRLSStatus(supabase, userId) {
  try {
    // Test a simple query to see if RLS is active
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error?.message?.includes('row') || error?.message?.includes('RLS')) {
      console.log('🔒 RLS is ENABLED and blocking queries');
      return { rlsEnabled: true, blocking: true };
    }

    if (data && data.length > 0) {
      console.log('🔓 RLS is DISABLED or permissive');
      return { rlsEnabled: false, blocking: false };
    }

    return { rlsEnabled: true, blocking: false };
  } catch (error) {
    console.error('Error testing RLS status:', error);
    return { rlsEnabled: true, blocking: true };
  }
}