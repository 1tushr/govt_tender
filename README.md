# GovTender Scout 🇮🇳

**Government Tender Auto-Scanner with AI-Powered Matching**

A complete SaaS platform that scrapes Indian government procurement portals, analyzes tender eligibility using rule-based AI, and delivers curated morning digests via WhatsApp and email.

## ✨ Features

### What It Does
- **Daily Auto-Scraping**: Scrapes GeM, CPPP, and state portals at 6 AM
- **AI Eligibility Parsing**: Extracts turnover requirements, certifications, and MSE preferences from PDFs
- **Smart Matching**: Matches tenders against user profiles (keywords, categories, states, value range)
- **Multi-Channel Alerts**: Sends WhatsApp + Email digests with deadline reminders
- **Dashboard**: Track applied/watching/skipped tenders with CSV export

### Revenue Plans
| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0/mo | 1 keyword, email only, CPPP only, 5 results/day |
| Basic | ₹999/mo | 5 keywords, WA+email, GeM+CPPP, unlimited, 72h alerts |
| Pro | ₹2,499/mo | Unlimited keywords, all portals, AI matching, PDF summaries |
| Agency | ₹5,999/mo | 5 sub-users, white-label, CSV export, PSU portals |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis (optional)

### Backend Setup

```bash
cd govtender-scout/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and other settings

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit with your backend URL

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

## 📁 Project Structure

```
govtender-scout/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings & env vars
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # Database models
│   │   ├── scrapers/            # Portal scrapers (CPPP, GeM)
│   │   ├── parsers/             # PDF extraction & AI parsing
│   │   ├── matching/            # Tender matching engine
│   │   ├── notifications/       # Email & WhatsApp
│   │   ├── routers/             # API endpoints
│   │   └── workers/             # Daily job scheduler
│   ├── alembic/                 # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Tailwind styles
│   ├── components/
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
├── railway.toml
└── SETUP_GUIDE.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 14 + TypeScript |
| Database | PostgreSQL 15 + SQLAlchemy |
| Scraping | Playwright + BeautifulSoup |
| PDF Processing | PyMuPDF + Tesseract OCR |
| AI Parsing | Rule-based regex (free) |
| Email | Gmail SMTP (free) |
| WhatsApp | Console mode (manual) or WATI |
| Auth | Supabase (free tier) |
| Payments | Razorpay Subscriptions |
| Hosting | Railway.app |

## 💰 Cost Breakdown (Monthly)

| Service | Free Tier | Paid at Scale |
|---------|-----------|---------------|
| Railway Hosting | $5 | ~$20 |
| PostgreSQL | Included | - |
| Redis | Included | - |
| Gmail SMTP | Free (500/day) | - |
| WhatsApp | Manual | $49 (WATI) |
| Proxies | None | ~₹2,000 |
| **Total** | **~₹400/mo** | **~₹5,000/mo** |

## 🔑 Environment Variables

See `backend/.env.example` for full list. Key variables:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/govtender
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
WA_MODE=console  # or 'wati' for automated WhatsApp
```

## 📡 API Endpoints

### Public
- `GET /health` - Health check
- `GET /api/tenders` - List tenders (paginated)
- `GET /api/tenders/{id}` - Get tender details

### Authenticated
- `GET /api/users/profile` - User profile
- `PUT /api/users/profile` - Update preferences
- `GET /api/users/tenders` - Matched tenders
- `POST /api/users/actions` - Mark action (applied/watching/skip)

### Webhooks
- `POST /api/webhooks/razorpay` - Payment events

## ⏰ Daily Pipeline Schedule

Runs automatically at **6:00 AM IST**:

1. **6:00 AM** - Scrapers hit portals
2. **6:30 AM** - PDF extraction & parsing
3. **7:00 AM** - Match against users
4. **8:00 AM** - Send digests

Manual run:
```python
from app.workers.daily_job import run_daily_pipeline
import asyncio
asyncio.run(run_daily_pipeline())
```

## 🚢 Deployment

### Railway.app (Recommended)

1. Push to GitHub
2. Deploy on Railway.app
3. Add PostgreSQL plugin
4. Set environment variables
5. Run: `railway run alembic upgrade head`

### Docker

```bash
docker-compose up -d
```

### Vercel (Frontend)

1. Connect GitHub repo
2. Set `NEXT_PUBLIC_API_URL`
3. Deploy!

## 📖 Documentation

- [Complete Setup Guide](SETUP_GUIDE.md) - Detailed deployment instructions
- [API Documentation](http://localhost:8000/docs) - Auto-generated OpenAPI docs

## 🤝 Contributing

This is a production-ready SaaS template. Feel free to:
- Add more portal scrapers
- Improve AI parsing accuracy
- Enhance the dashboard UI
- Add analytics features

## 📄 License

MIT License - Free for commercial use.

## 🙏 Credits

Built with ❤️ for Indian MSMEs competing in government procurement.

---

**Ready to launch?** Read the [Setup Guide](SETUP_GUIDE.md) and deploy in 30 minutes!
