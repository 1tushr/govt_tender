// GovTender Scout - Send Notification Edge Function
// Sends email and WhatsApp notifications to users

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY')
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get notification ID or send bulk digest
    const { notification_id, user_id, type = 'digest' } = await req.json()
    
    let notifications = []
    
    if (notification_id) {
      // Send specific notification
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles (full_name, mobile, email_notifications, whatsapp_notifications),
          tenders (title, bid_end_date, portal_url)
        `)
        .eq('id', notification_id)
        .single()
      
      if (error || !data) {
        throw new Error('Notification not found')
      }
      
      notifications = [data]
    } else if (user_id) {
      // Send all unread notifications for user
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles (full_name, mobile, email_notifications, whatsapp_notifications),
          tenders (title, bid_end_date, portal_url)
        `)
        .eq('user_id', user_id)
        .eq('is_read', false)
        .eq('sent_at', null)
      
      if (error) {
        throw new Error('Failed to fetch notifications')
      }
      
      notifications = data || []
    } else if (type === 'digest') {
      // Send daily digest to all users with expiring tenders
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('email_notifications', true)
      
      if (!profiles || profiles.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No users for digest' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      // Get expiring tenders for each user
      for (const profile of profiles) {
        const { data: expiringTenders } = await supabase
          .from('tenders')
          .select('*')
          .eq('status', 'active')
          .gte('bid_end_date', new Date().toISOString())
          .lte('bid_end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(5)
        
        if (expiringTenders && expiringTenders.length > 0) {
          const { error } = await supabase.from('notifications').insert({
            user_id: profile.id,
            notification_type: 'digest',
            channel: 'email',
            title: `📋 Daily Tender Digest - ${expiringTenders.length} Opportunities`,
            message: `You have ${expiringTenders.length} tenders expiring in the next 7 days. Don't miss out!`,
            metadata: { tender_ids: expiringTenders.map(t => t.id) }
          })
          
          if (!error) {
            notifications.push({
              profiles: profile,
              tenders: expiringTenders
            })
          }
        }
      }
    }
    
    // Process each notification
    const results = []
    
    for (const notif of notifications) {
      const result: any = { notification_id: notif.id, channels: {} }
      
      // Send Email via Resend
      if (notif.channel === 'email' || notif.channel === 'digest') {
        if (resendApiKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: 'GovTender Scout <alerts@govtenderscout.in>',
                to: `${notif.profiles.full_name} <${notif.profiles.email}>`,
                subject: notif.title,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #059669;">${notif.title}</h2>
                    <p>${notif.message}</p>
                    ${notif.tenders ? `
                      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Tender Details:</h3>
                        <p><strong>Title:</strong> ${notif.tenders.title}</p>
                        <p><strong>Deadline:</strong> ${new Date(notif.tenders.bid_end_date).toLocaleDateString('en-IN')}</p>
                        <a href="${notif.tenders.portal_url}" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Tender</a>
                      </div>
                    ` : ''}
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                      Best regards,<br/>
                      The GovTender Scout Team<br/>
                      <small>You're receiving this because you enabled email notifications. 
                      <a href="https://govtenderscout.in/unsubscribe">Unsubscribe</a></small>
                    </p>
                  </div>
                `
              })
            })
            
            if (emailResponse.ok) {
              result.channels.email = 'sent'
            } else {
              result.channels.email = 'failed'
              result.email_error = await emailResponse.text()
            }
          } catch (error) {
            result.channels.email = 'failed'
            result.email_error = error.message
          }
        } else {
          result.channels.email = 'skipped_no_api_key'
        }
      }
      
      // Send WhatsApp via Twilio
      if (notif.channel === 'whatsapp' && notif.profiles.whatsapp_notifications) {
        if (twilioApiKey && twilioAccountSid) {
          try {
            const whatsappMessage = `🎯 ${notif.title}\n\n${notif.message}\n\n${notif.tenders ? `Deadline: ${new Date(notif.tenders.bid_end_date).toLocaleDateString('en-IN')}\nView: ${notif.tenders.portal_url}` : ''}`
            
            const whatsappResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioApiKey}`)
                },
                body: new URLSearchParams({
                  From: 'whatsapp:+14155238886', // Twilio sandbox
                  To: `whatsapp:+91${notif.profiles.mobile}`,
                  Body: whatsappMessage
                })
              }
            )
            
            if (whatsappResponse.ok) {
              result.channels.whatsapp = 'sent'
            } else {
              result.channels.whatsapp = 'failed'
              result.whatsapp_error = await whatsappResponse.text()
            }
          } catch (error) {
            result.channels.whatsapp = 'failed'
            result.whatsapp_error = error.message
          }
        } else {
          result.channels.whatsapp = 'skipped_no_api_key'
        }
      }
      
      // Mark notification as sent
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notif.id)
      
      results.push(result)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        total_processed: notifications.length,
        results: results
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('Send notification failed:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
