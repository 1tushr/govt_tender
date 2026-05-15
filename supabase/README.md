# GovTender Scout - Supabase Setup Guide

## 🚀 Quick Start

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Create account at https://supabase.com
3. Create a new project

### Step 1: Link Your Project
```bash
cd /workspace/supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Apply Database Migrations
```bash
supabase db push
```

This will create:
- ✅ Users table (profiles) with Indian mobile validation
- ✅ Subscriptions table with plan tiers
- ✅ Tenders table with AI analysis fields
- ✅ User tender interactions tracking
- ✅ Notifications table (email/WhatsApp)
- ✅ Monitoring logs for portal checks
- ✅ Row Level Security (RLS) policies
- ✅ Auto-trigger for profile creation on signup
- ✅ Performance indexes
- ✅ Useful views (expiring soon, new tenders, dashboard stats)

### Step 3: Seed Sample Data
```bash
psql "postgresql://postgres:[password]@db.[ref].supabase.co/postgres" -f seed/001_seed_data.sql
```

Or run via Supabase Dashboard → SQL Editor → Paste contents of `seed/001_seed_data.sql`

This adds **25 sample tenders** from major portals:
- CPPP, GeM, IREPS, ISRO, DRDO, NTPC, BSNL, NHAI
- State portals: Rajasthan, TN, Karnataka, Maharashtra, Gujarat, etc.
- Values ranging from ₹15 lakhs to ₹125 crores
- AI eligibility matching pre-calculated

### Step 4: Deploy Edge Functions
```bash
# Set environment variables in Supabase Dashboard or CLI
supabase secrets set ANTHROPIC_API_KEY=your_key
supabase secrets set RESEND_API_KEY=your_key
supabase secrets set TWILIO_API_KEY=your_key
supabase secrets set TWILIO_ACCOUNT_SID=your_sid

# Deploy functions
supabase functions deploy monitor-tenders
supabase functions deploy ai-eligibility
supabase functions deploy send-notification
```

### Step 5: Schedule Cron Jobs

Set up automated monitoring in Supabase Dashboard → Database → Cron:

**Daily Monitoring (6 AM IST):**
```sql
SELECT cron.schedule(
  'daily-monitor',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-tenders',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);
```

**Daily Digest (8 AM IST):**
```sql
SELECT cron.schedule(
  'daily-digest',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{"type": "digest"}'::jsonb
  )
  $$
);
```

## 🔐 Environment Variables Required

| Variable | Description | Get From |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | AI for eligibility matching | https://console.anthropic.com |
| `RESEND_API_KEY` | Email notifications | https://resend.com (free 100/day) |
| `TWILIO_API_KEY` | WhatsApp alerts | https://twilio.com |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Twilio Console |

## 📊 Database Schema Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   profiles  │────<│ subscriptions│     │   tenders   │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (UUID)   │     │ id           │     │ id          │
│ full_name   │     │ user_id      │     │ tender_num  │
│ mobile      │     │ plan         │     │ title       │
│ company     │     │ status       │     │ portal      │
│ keywords[]  │     │ features     │     │ end_date    │
│ states[]    │     └──────────────┘     │ ai_match    │
│ categories[]│                          └─────────────┘
└─────────────┘                                 │
       │                                        │
       │         ┌──────────────────┐          │
       └────────<│  interactions    │>─────────┘
                 ├──────────────────┤
                 │ user_id          │
                 │ tender_id        │
                 │ type             │
                 └──────────────────┘
```

## 🧪 Testing

### Test Authentication Trigger
```sql
-- Create test user (run in Supabase SQL Editor)
INSERT INTO auth.users (email, raw_user_meta_data)
VALUES (
  'test@govtenderscout.in',
  '{"full_name": "Test User", "mobile": "9876543210", "company_name": "Test Corp"}'
);

-- Verify profile was auto-created
SELECT * FROM public.profiles WHERE email = 'test@govtenderscout.in';
```

### Test Edge Functions Locally
```bash
# Run monitor function locally
supabase functions serve monitor-tenders --env-file .env

# Test with curl
curl -X POST http://localhost:54321/functions/v1/monitor-tenders \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Query Sample Data
```sql
-- Get all active tenders
SELECT COUNT(*) FROM public.tenders WHERE status = 'active';

-- Get expiring soon (7 days)
SELECT title, bid_end_date, estimated_value 
FROM public.tenders_expiring_soon;

-- Get AI-matched tenders
SELECT title, ai_confidence_score 
FROM public.tenders 
WHERE ai_eligibility_match = true 
ORDER BY ai_confidence_score DESC;

-- Dashboard stats view
SELECT * FROM public.user_dashboard_stats;
```

## 🎯 Next Steps

1. **Connect Frontend**: Update frontend `.env` with Supabase credentials
2. **Add Payment**: Integrate Razorpay for subscription upgrades
3. **Build Scrapers**: Add real portal scrapers to monitor function
4. **Customize Emails**: Brand notification templates
5. **Deploy**: Push to production Supabase project

## 📞 Support

- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Status: https://status.supabase.com

---

Made with ❤️ for Indian businesses winning government contracts!
