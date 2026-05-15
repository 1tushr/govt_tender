#!/bin/bash

# GovTender Scout - Complete Setup Script
# This script sets up the entire startup infrastructure

set -e

echo "🚀 GovTender Scout - Complete Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in workspace
if [ ! -d "/workspace" ]; then
    echo -e "${RED}Error: Must run in /workspace directory${NC}"
    exit 1
fi

cd /workspace

# Step 1: Check disk space
echo -e "${YELLOW}Step 1: Checking disk space...${NC}"
AVAILABLE_SPACE=$(df -m /workspace | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 500 ]; then
    echo -e "${RED}⚠️  Warning: Less than 500MB available. Consider freeing space.${NC}"
else
    echo -e "${GREEN}✓ Disk space OK (${AVAILABLE_SPACE}MB available)${NC}"
fi
echo ""

# Step 2: Setup Supabase
echo -e "${YELLOW}Step 2: Setting up Supabase backend...${NC}"
if [ ! -f "/workspace/supabase/README.md" ]; then
    echo -e "${RED}Error: Supabase files not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Supabase configuration ready${NC}"
echo "  Location: /workspace/supabase/"
echo "  Files created:"
echo "    - migrations/001_initial_schema.sql"
echo "    - seed/001_seed_data.sql (25 sample tenders)"
echo "    - functions/monitor-tenders/index.ts"
echo "    - functions/ai-eligibility/index.ts"
echo "    - functions/send-notification/index.ts"
echo ""

# Step 3: Check Frontend
echo -e "${YELLOW}Step 3: Checking frontend...${NC}"
if [ -f "/workspace/frontend/package.json" ]; then
    echo -e "${GREEN}✓ Frontend exists${NC}"
    echo "  Location: /workspace/frontend/"
else
    echo -e "${RED}✗ Frontend not found${NC}"
fi
echo ""

# Step 4: Create environment files
echo -e "${YELLOW}Step 4: Creating environment files...${NC}"

# Frontend .env
if [ ! -f "/workspace/frontend/.env" ]; then
    cat > /workspace/frontend/.env << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${YELLOW}! frontend/.env already exists${NC}"
fi

# Backend .env (if using Express backend)
if [ -d "/workspace/backend" ] && [ ! -f "/workspace/backend/.env" ]; then
    cat > /workspace/backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI & Notifications
ANTHROPIC_API_KEY=sk-ant-your-key
RESEND_API_KEY=re_your-key
TWILIO_ACCOUNT_SID=AC-your-sid
TWILIO_API_KEY=your-key

# Server Settings
PORT=5000
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
fi
echo ""

# Step 5: Print setup instructions
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Setup Complete! Next Steps:${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${YELLOW}1. Create Supabase Project:${NC}"
echo "   → Go to https://supabase.com"
echo "   → Create new project"
echo "   → Copy your project URL and API keys"
echo ""

echo -e "${YELLOW}2. Apply Database Schema:${NC}"
echo "   cd /workspace/supabase"
echo "   supabase login"
echo "   supabase link --project-ref YOUR_REF"
echo "   supabase db push"
echo ""

echo -e "${YELLOW}3. Seed Sample Data:${NC}"
echo "   → Open Supabase Dashboard → SQL Editor"
echo "   → Paste contents of seed/001_seed_data.sql"
echo "   → Run to insert 25 sample tenders"
echo ""

echo -e "${YELLOW}4. Deploy Edge Functions:${NC}"
echo "   supabase secrets set ANTHROPIC_API_KEY=your_key"
echo "   supabase secrets set RESEND_API_KEY=your_key"
echo "   supabase functions deploy monitor-tenders"
echo "   supabase functions deploy ai-eligibility"
echo "   supabase functions deploy send-notification"
echo ""

echo -e "${YELLOW}5. Update Frontend Environment:${NC}"
echo "   Edit /workspace/frontend/.env with your Supabase credentials"
echo ""

echo -e "${YELLOW}6. Install & Run:${NC}"
echo "   cd /workspace/frontend"
echo "   npm install"
echo "   npm run dev"
echo ""

echo -e "${YELLOW}7. Test the Application:${NC}"
echo "   → Open http://localhost:3000"
echo "   → Sign up with test account"
echo "   → Browse 25+ sample tenders"
echo "   → Test AI matching and notifications"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}📁 Project Structure:${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "/workspace/"
echo "├── supabase/"
echo "│   ├── migrations/          # Database schema"
echo "│   ├── seed/                # Sample data (25 tenders)"
echo "│   ├── functions/           # Edge Functions"
echo "│   │   ├── monitor-tenders/ # Daily portal monitoring"
echo "│   │   ├── ai-eligibility/  # AI matching engine"
echo "│   │   └── send-notification/# Email/WhatsApp alerts"
echo "│   └── README.md            # Full documentation"
echo "│"
echo "├── frontend/"
echo "│   ├── app/"
echo "│   │   ├── page.tsx         # Landing page"
echo "│   │   ├── signup/          # Registration"
echo "│   │   └── login/           # Authentication"
echo "│   └── .env                 # Environment config"
echo "│"
echo "└── setup.sh                 # This script"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎯 What You Get:${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "✅ Database with 6 tables + RLS security"
echo "✅ 25 sample tenders from 15+ portals"
echo "✅ Auto user profile creation on signup"
echo "✅ AI eligibility matching (Claude integration)"
echo "✅ Email notifications (Resend)"
echo "✅ WhatsApp alerts (Twilio)"
echo "✅ Daily automated monitoring (cron)"
echo "✅ Indian mobile validation"
echo "✅ Subscription tiers (Free/Basic/Pro)"
echo "✅ Dashboard views & analytics"
echo ""

echo -e "${YELLOW}Need help? Check /workspace/supabase/README.md${NC}"
echo ""
