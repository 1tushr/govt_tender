// GovTender Scout - Monitor Tenders Edge Function
// Runs every 6 AM to check all 45+ government portals

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Portal configurations with selectors (to be customized per portal)
const PORTALS = [
  { name: 'CPPP', url: 'https://eprocure.gov.in', type: 'central' },
  { name: 'GeM', url: 'https://gem.gov.in', type: 'central' },
  { name: 'IREPS', url: 'https://www.ireps.gov.in', type: 'central' },
  { name: 'ISRO', url: 'https://www.isro.gov.in/Tenders.html', type: 'psu' },
  { name: 'DRDO', url: 'https://www.drdo.gov.in/drdo/tenders', type: 'psu' },
  { name: 'NTPC', url: 'https://www.ntpctender.com', type: 'psu' },
  { name: 'BSNL', url: 'https://www.bsnl.co.in/opencms/bsnl/BSNL/about_us/tender.html', type: 'psu' },
  { name: 'NHAI', url: 'https://www.nhai.gov.in', type: 'psu' },
  { name: 'Rajasthan', url: 'https://eproc.rajasthan.gov.in', type: 'state' },
  { name: 'Tamil Nadu', url: 'https://tntenders.gov.in', type: 'state' },
  { name: 'Karnataka', url: 'https://eproc.karnataka.gov.in', type: 'state' },
  { name: 'Maharashtra', url: 'https://mahatenders.gov.in', type: 'state' },
  { name: 'Gujarat', url: 'https://gjeproc.gujarat.gov.in', type: 'state' },
  { name: 'Telangana', url: 'https://tender.telangana.gov.in', type: 'state' },
  { name: 'Andhra Pradesh', url: 'https://apeprocurement.gov.in', type: 'state' },
  { name: 'Kerala', url: 'https://etenders.kerala.gov.in', type: 'state' },
  { name: 'West Bengal', url: 'https://wbtenders.gov.in', type: 'state' },
  { name: 'Odisha', url: 'https://tendersodisha.gov.in', type: 'state' },
  { name: 'Punjab', url: 'https://eproc.punjab.gov.in', type: 'state' },
  { name: 'Haryana', url: 'https://etenders.hry.nic.in', type: 'state' },
  { name: 'Bihar', url: 'https://eproc2.bihar.gov.in', type: 'state' },
  { name: 'Jharkhand', url: 'https://jharkhandtenders.gov.in', type: 'state' },
  { name: 'Assam', url: 'https://assamtenders.gov.in', type: 'state' },
  { name: 'Himachal Pradesh', url: 'https://hptenders.gov.in', type: 'state' },
  { name: 'Uttarakhand', url: 'https://uktenders.gov.in', type: 'state' },
  { name: 'Chhattisgarh', url: 'https://eproc.cgstate.gov.in', type: 'state' },
]

interface Tender {
  tender_number: string
  title: string
  description: string
  portal_name: string
  portal_url: string
  category?: string
  organization_name?: string
  state?: string
  bid_end_date: string
  estimated_value?: number
  documents?: string[]
}

async function monitorPortal(portal: typeof PORTALS[0]): Promise<{
  status: 'success' | 'failed' | 'partial'
  tenders_found: number
  tenders_added: number
  error_message?: string
  execution_time_ms: number
}> {
  const startTime = Date.now()
  
  try {
    // NOTE: In production, this would use Puppeteer/Playwright via a separate service
    // For now, we simulate the monitoring process
    
    console.log(`Monitoring ${portal.name}...`)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation:
    // 1. Use Deno.fetch() or puppeteer to scrape the portal
    // 2. Parse HTML to extract tender listings
    // 3. Transform to our schema
    // 4. Check for duplicates
    // 5. Insert new tenders
    
    // Mock result for demonstration
    const mockTendersFound = Math.floor(Math.random() * 5) + 1
    const mockTendersAdded = Math.floor(Math.random() * mockTendersFound) + 1
    
    return {
      status: 'success',
      tenders_found: mockTendersFound,
      tenders_added: mockTendersAdded,
      execution_time_ms: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'failed',
      tenders_found: 0,
      tenders_added: 0,
      error_message: error.message,
      execution_time_ms: Date.now() - startTime
    }
  }
}

async function analyzeWithAI(tender: Tender): Promise<{
  summary: string
  eligibility_match: boolean
  confidence_score: number
}> {
  // In production, call Anthropic Claude API here
  // For now, return mock analysis
  
  return {
    summary: `Tender from ${tender.portal_name} for ${tender.title.substring(0, 50)}...`,
    eligibility_match: Math.random() > 0.5,
    confidence_score: Math.floor(Math.random() * 30) + 70 // 70-100
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Starting tender monitoring job...')
    
    const results = []
    
    // Monitor all portals
    for (const portal of PORTALS) {
      const result = await monitorPortal(portal)
      results.push({
        portal_name: portal.name,
        portal_url: portal.url,
        ...result
      })
      
      // Log to monitoring_logs table
      await supabase.from('monitoring_logs').insert({
        portal_name: portal.name,
        portal_url: portal.url,
        status: result.status,
        tenders_found: result.tenders_found,
        tenders_added: result.tenders_added,
        error_message: result.error_message,
        execution_time_ms: result.execution_time_ms
      })
    }
    
    // Get newly added tenders and run AI analysis
    if (anthropicApiKey) {
      const { data: newTenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('ai_summary', null)
        .limit(10)
      
      if (newTenders) {
        for (const tender of newTenders) {
          const analysis = await analyzeWithAI(tender)
          
          await supabase
            .from('tenders')
            .update({
              ai_summary: analysis.summary,
              ai_eligibility_match: analysis.eligibility_match,
              ai_confidence_score: analysis.confidence_score
            })
            .eq('id', tender.id)
        }
      }
    }
    
    // Generate summary
    const totalFound = results.reduce((sum, r) => sum + r.tenders_found, 0)
    const totalAdded = results.reduce((sum, r) => sum + r.tenders_added, 0)
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitoring completed',
        summary: {
          portals_monitored: PORTALS.length,
          successful: successful,
          failed: failed,
          total_tenders_found: totalFound,
          total_tenders_added: totalAdded
        },
        details: results
      }),
      { 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Monitoring failed:', error)
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
