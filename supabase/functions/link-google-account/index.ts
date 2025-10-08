import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { email, googleId } = await req.json()

    if (!email || !googleId) {
      throw new Error('Email and googleId are required')
    }

    console.log(`Linking Google account for ${email}`)

    // Get user by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()

    if (getUserError) {
      throw getUserError
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      throw new Error('User not found')
    }

    // Generate Google-derived password
    const googlePassword = `google_${googleId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: googlePassword }
    )

    if (updateError) {
      throw updateError
    }

    console.log(`Successfully linked Google account for ${email}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Google account linked successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
