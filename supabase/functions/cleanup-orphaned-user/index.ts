import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`🔍 Checking for orphaned auth user with email: ${email}`)

    // Get all auth users with this email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error listing auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to list users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter by email
    const usersWithEmail = authUsers.users.filter(u => u.email === email)

    if (usersWithEmail.length === 0) {
      console.log('ℹ️ No auth users found with this email')
      return new Response(
        JSON.stringify({ message: 'No users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${usersWithEmail.length} auth user(s) with email ${email}`)

    // Check which ones are orphaned (no user_profiles entry)
    const orphanedUsers = []

    for (const authUser of usersWithEmail) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('supabase_auth_id', authUser.id)
        .maybeSingle()

      if (!profile && !profileError) {
        orphanedUsers.push(authUser)
        console.log(`⚠️ Orphaned user found: ${authUser.id}`)
      }
    }

    if (orphanedUsers.length === 0) {
      console.log('ℹ️ No orphaned users found')
      return new Response(
        JSON.stringify({ message: 'No orphaned users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🧹 Cleaning up ${orphanedUsers.length} orphaned user(s)...`)

    // Delete each orphaned user
    const deletedIds = []
    for (const orphan of orphanedUsers) {
      // Delete any upgrade_requests first (foreign key constraint)
      await supabaseAdmin
        .from('upgrade_requests')
        .delete()
        .eq('reviewed_by', orphan.id)

      // Delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphan.id)

      if (deleteError) {
        console.error(`❌ Failed to delete user ${orphan.id}:`, deleteError)
      } else {
        console.log(`✅ Deleted orphaned user: ${orphan.id}`)
        deletedIds.push(orphan.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedIds.length,
        deletedIds: deletedIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in cleanup-orphaned-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
