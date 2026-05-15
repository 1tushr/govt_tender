// GovTender Scout - AI Eligibility Matching Edge Function
// Analyzes tender documents and matches against user profiles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get tender ID from request
    const { tender_id } = await req.json()
    
    if (!tender_id) {
      throw new Error('tender_id is required')
    }

    // Fetch tender details
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tender_id)
      .single()

    if (tenderError || !tender) {
      throw new Error('Tender not found')
    }

    // Fetch all active user profiles with their preferences
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions (
          plan,
          features
        )
      `)
      .eq('email_notifications', true)

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to match',
          matches: []
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Prepare tender context for AI
    const tenderContext = `
      Tender: ${tender.title}
      Description: ${tender.description}
      Category: ${tender.category}
      Organization: ${tender.organization_name}
      State: ${tender.state}
      Estimated Value: ₹${tender.estimated_value?.toLocaleString('en-IN')}
      Bid End Date: ${new Date(tender.bid_end_date).toLocaleDateString('en-IN')}
      Eligibility Criteria: ${JSON.stringify(tender.eligibility_criteria)}
    `

    // Match against each user profile
    const matches = []
    
    for (const profile of profiles) {
      const userContext = `
        User: ${profile.full_name}
        Company: ${profile.company_name}
        Keywords: ${profile.keywords?.join(', ') || 'None'}
        Preferred States: ${profile.preferred_states?.join(', ') || 'All India'}
        Categories: ${profile.categories?.join(', ') || 'All'}
        Subscription: ${profile.subscriptions?.[0]?.plan || 'free'}
      `

      // Call Anthropic Claude API for matching
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are a tender eligibility expert. Analyze if this user qualifies for the government tender.

${tenderContext}

${userContext}

Respond in JSON format:
{
  "eligible": boolean,
  "confidence_score": number (0-100),
  "reasons": string[],
  "missing_criteria": string[],
  "recommendation": string
}`
            }
          ]
        })
      })

      if (!aiResponse.ok) {
        console.error('AI API failed:', await aiResponse.text())
        continue
      }

      const aiResult = await aiResponse.json()
      const analysis = JSON.parse(aiResult.content[0].text)

      // Store AI analysis in tender
      await supabase
        .from('tenders')
        .update({
          ai_summary: analysis.recommendation,
          ai_eligibility_match: analysis.eligible,
          ai_confidence_score: analysis.confidence_score
        })
        .eq('id', tender_id)

      // If eligible, create notification
      if (analysis.eligible && analysis.confidence_score >= 70) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            tender_id: tender.id,
            notification_type: 'eligibility_match',
            channel: 'email',
            title: `🎯 High Match: ${tender.title.substring(0, 50)}...`,
            message: analysis.recommendation,
            metadata: {
              confidence_score: analysis.confidence_score,
              reasons: analysis.reasons,
              deadline: tender.bid_end_date
            }
          })

        if (!notifError) {
          matches.push({
            user_id: profile.id,
            user_name: profile.full_name,
            company: profile.company_name,
            confidence_score: analysis.confidence_score,
            reasons: analysis.reasons
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tender_id: tender.id,
        tender_title: tender.title,
        total_profiles_analyzed: profiles.length,
        matches_found: matches.length,
        matches: matches
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('AI eligibility matching failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
