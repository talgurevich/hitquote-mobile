import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper to get business ID from auth user ID
async function getBusinessId(supabase: any, authUserId: string) {
  try {
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()

    if (profileError || !userProfile) {
      console.error('Error getting user profile:', profileError)
      return null
    }

    // Get business ID from business_members
    const { data: businessMember, error: memberError } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userProfile.id)
      .limit(1)
      .maybeSingle()

    if (memberError) {
      console.error('Error getting business member:', memberError)
      return null
    }

    return businessMember?.business_id || null
  } catch (error) {
    console.error('Error in getBusinessId:', error)
    return null
  }
}

// Helper to send Slack notification
async function sendSlackNotification(userEmail: string, displayName: string, requestedPlan: string) {
  try {
    const webhookUrl = Deno.env.get('SLACK_ADMIN_ALERTS_WEBHOOK_URL')

    if (!webhookUrl) {
      console.log('Slack webhook not configured, skipping notification')
      return
    }

    const message = `
:raised_hand: *Upgrade Request Submitted*
*User:* ${userEmail}
*Name:* ${displayName || 'Not provided'}
*Requested Plan:* ${requestedPlan}
*Status:* Pending Review
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}

_Action Required: Review at web admin panel_
    `.trim()

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText)
    } else {
      console.log('✓ Slack notification sent')
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error)
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // GET: Fetch user's upgrade request status
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const authUserId = url.searchParams.get('authUserId')

      if (!authUserId) {
        return new Response(
          JSON.stringify({ error: 'Missing authUserId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the most recent upgrade request
      const { data: upgradeRequest, error } = await supabase
        .from('upgrade_requests')
        .select('id, status, requested_plan, created_at, admin_notes')
        .eq('auth_user_id', authUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching upgrade request:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          hasRequest: !!upgradeRequest,
          request: upgradeRequest || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Create new upgrade request
    if (req.method === 'POST') {
      const { authUserId, email, displayName, requestedPlan } = await req.json()

      if (!authUserId || !email) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get business ID
      const businessId = await getBusinessId(supabase, authUserId)

      // Check for existing pending request
      const { data: existingRequest } = await supabase
        .from('upgrade_requests')
        .select('id, status')
        .eq('auth_user_id', authUserId)
        .eq('status', 'pending')
        .maybeSingle()

      if (existingRequest) {
        return new Response(
          JSON.stringify({
            error: 'You already have a pending upgrade request',
            requestId: existingRequest.id
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create new upgrade request
      const { data: newRequest, error: insertError } = await supabase
        .from('upgrade_requests')
        .insert({
          auth_user_id: authUserId,
          business_id: businessId,
          user_email: email,
          user_name: displayName || email,
          requested_plan: requestedPlan || 'premium',
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating upgrade request:', insertError)
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Upgrade request created:', newRequest.id, 'for user:', email)

      // Send Slack notification (fire-and-forget)
      sendSlackNotification(email, displayName || email, requestedPlan || 'premium')

      return new Response(
        JSON.stringify({
          message: 'Upgrade request submitted successfully',
          requestId: newRequest.id,
          status: 'pending'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unsupported method
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
