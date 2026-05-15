-- GovTender Scout - Initial Database Schema
-- Run this migration to create all core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile VARCHAR(10) NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
    company_name TEXT,
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
    keywords TEXT[] DEFAULT '{}',
    preferred_states TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    email_notifications BOOLEAN DEFAULT true,
    whatsapp_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'basic', 'pro')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    features JSONB DEFAULT '{"keywords": 1, "portals": ["cppp"], "alerts": ["email"], "results_per_day": 5}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENDERS TABLE
-- ============================================
CREATE TABLE public.tenders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tender_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    portal_name TEXT NOT NULL,
    portal_url TEXT NOT NULL,
    category TEXT,
    sub_category TEXT,
    organization_name TEXT,
    state TEXT,
    city TEXT,
    tender_type VARCHAR(50) CHECK (tender_type IN ('goods', 'services', 'works', 'consultancy')),
    bid_start_date TIMESTAMPTZ,
    bid_end_date TIMESTAMPTZ NOT NULL,
    pre_bid_date TIMESTAMPTZ,
    estimated_value NUMERIC(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    emd_amount NUMERIC(15,2),
    eligibility_criteria JSONB,
    documents JSONB DEFAULT '[]',
    ai_summary TEXT,
    ai_eligibility_match BOOLEAN,
    ai_confidence_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'awarded', 'cancelled', 'extended')),
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TENDER INTERACTIONS
-- ============================================
CREATE TABLE public.user_tender_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('viewed', 'saved', 'applied', 'skipped', 'shared')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tender_id, interaction_type)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('new_tender', 'deadline_reminder', 'status_update', 'eligibility_match', 'digest')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MONITORING LOGS
-- ============================================
CREATE TABLE public.monitoring_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portal_name TEXT NOT NULL,
    portal_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial', 'skipped')),
    tenders_found INTEGER DEFAULT 0,
    tenders_added INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_tenders_status ON public.tenders(status);
CREATE INDEX idx_tenders_end_date ON public.tenders(bid_end_date);
CREATE INDEX idx_tenders_portal ON public.tenders(portal_name);
CREATE INDEX idx_tenders_state ON public.tenders(state);
CREATE INDEX idx_tenders_category ON public.tenders(category);
CREATE INDEX idx_tenders_ai_match ON public.tenders(ai_eligibility_match) WHERE ai_eligibility_match = true;
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_interactions_user ON public.user_tender_interactions(user_id);
CREATE INDEX idx_monitoring_logs_portal ON public.monitoring_logs(portal_name, executed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tender_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions: Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Tenders: Everyone can read, only admins can modify (handled via service role)
CREATE POLICY "Anyone can view tenders" ON public.tenders
    FOR SELECT USING (true);

-- User Tender Interactions: Users can only manage their own interactions
CREATE POLICY "Users can view own interactions" ON public.user_tender_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions" ON public.user_tender_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON public.user_tender_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Monitoring Logs: Only admins/service role can view
CREATE POLICY "Service role can view monitoring logs" ON public.monitoring_logs
    FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
    BEFORE UPDATE ON public.tenders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTH TRIGGER: Create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, mobile, company_name, subscription_tier)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'mobile',
        NEW.raw_user_meta_data->>'company_name',
        'free'
    );
    
    INSERT INTO public.subscriptions (user_id, plan, status, trial_end_date)
    VALUES (
        NEW.id,
        'free',
        'trial',
        NOW() + INTERVAL '14 days'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active tenders expiring soon (within 7 days)
CREATE VIEW public.tenders_expiring_soon AS
SELECT * FROM public.tenders
WHERE status = 'active'
  AND bid_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY bid_end_date ASC;

-- New tenders (last 24 hours)
CREATE VIEW public.tenders_new AS
SELECT * FROM public.tenders
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- User dashboard stats
CREATE VIEW public.user_dashboard_stats AS
SELECT 
    p.id as user_id,
    COUNT(DISTINCT CASE WHEN uti.interaction_type = 'saved' THEN uti.tender_id END) as saved_count,
    COUNT(DISTINCT CASE WHEN uti.interaction_type = 'applied' THEN uti.tender_id END) as applied_count,
    COUNT(DISTINCT CASE WHEN uti.interaction_type = 'viewed' THEN uti.tender_id END) as viewed_count,
    (SELECT COUNT(*) FROM public.notifications n WHERE n.user_id = p.id AND NOT n.is_read) as unread_notifications
FROM public.profiles p
LEFT JOIN public.user_tender_interactions uti ON p.id = uti.user_id
GROUP BY p.id;

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and features';
COMMENT ON TABLE public.tenders IS 'Government tender opportunities from multiple portals';
COMMENT ON TABLE public.user_tender_interactions IS 'Track user engagement with tenders';
COMMENT ON TABLE public.notifications IS 'User notifications across channels';
COMMENT ON TABLE public.monitoring_logs IS 'Portal monitoring execution logs';
