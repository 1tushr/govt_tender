# GovTender Scout - Free Tier Edition

Government Tender Auto-Scanner with AI-powered eligibility matching. **100% free to run** - no paid API dependencies.

## 🎯 What It Does

- **Scrapes** Indian government procurement portals (CPPP, GeM) daily
- **Extracts** eligibility criteria from tender PDFs using rule-based parsing (no AI costs)
- **Matches** tenders to user profiles based on keywords, category, state, and value
- **Notifies** users via email (SMTP) and WhatsApp (manual/log mode for free tier)
- **Tracks** user actions (Applied/Watching/Skip) in a dashboard

## 💰 Zero-Cost Architecture

| Service | Free Alternative | Cost |
|---------|-----------------|------|
| ~~Anthropic Claude AI~~ | Rule-based regex extraction | ₹0 |
| ~~Resend Email API~~ | Gmail SMTP | ₹0 |
| ~~WATI WhatsApp~~ | Log-to-console + manual send | ₹0 |
| ~~Bright Data Proxies~~ | Direct scraping (polite delays) | ₹0 |
| ~~Cloudflare R2~~ | In-memory PDF processing | ₹0 |

**Total monthly cost: ₹0** (excluding your own server/hosting)

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd govtender-scout/backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

**Minimum required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_USER` and `SMTP_PASSWORD` - For email notifications (optional)

### 3. Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-hin libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Install Playwright browsers
playwright install chromium
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Start the Application

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Visit `http://localhost:8000/docs` for API documentation.

## 📁 Project Structure

```
govtender-scout/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings & env vars
│   │   ├── database.py          # SQLAlchemy async setup
│   │   ├── models/
│   │   │   ├── tender.py        # Tender database model
│   │   │   ├── user.py          # User & subscription model
│   │   │   └── digest.py        # Digest send log
│   │   ├── scrapers/
│   │   │   ├── base.py          # Base scraper class
│   │   │   ├── cppp.py          # CPPP portal scraper
│   │   │   └── gem.py           # GeM portal scraper
│   │   ├── parsers/
│   │   │   ├── pdf_extractor.py # PDF text + OCR extraction
│   │   │   └── ai_parser.py     # Rule-based eligibility parser
│   │   ├── matching/
│   │   │   └── engine.py        # Tender-user matching logic
│   │   ├── notifications/
│   │   │   ├── email.py         # SMTP email sender
│   │   │   └── whatsapp.py      # WhatsApp logger (free mode)
│   │   ├── routers/
│   │   │   ├── users.py         # User API endpoints
│   │   │   ├── tenders.py       # Tender API endpoints
│   │   │   └── webhooks.py      # Razorpay webhook handler
│   │   └── workers/
│   │       ├── scheduler.py     # APScheduler cron setup
│   │       └── daily_job.py     # Daily scraping pipeline
│   ├── alembic/                 # Database migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # Next.js dashboard (to be built)
├── docker-compose.yml
├── railway.toml
└── .env.example
```

## 🔧 Features

### Scraping
- **CPPP (eprocure.gov.in)** - Central Public Procurement Portal
- **GeM (gem.gov.in)** - Government e-Marketplace
- Polite scraping with delays to avoid blocking
- No proxy required for basic usage

### PDF Processing
- Text extraction from digital PDFs (PyMuPDF)
- OCR for scanned documents (Tesseract)
- English + Hindi language support
- In-memory processing (no cloud storage costs)

### Eligibility Parsing (Rule-Based)
Extracts without AI:
- Minimum turnover requirements
- Years of experience needed
- Required certifications (ISO, MSME, etc.)
- MSE/Startup/Women reservations
- State preferences

### Matching Engine
- Keyword matching (full-text search)
- Category filtering
- State filtering
- Value range filtering
- Eligibility scoring

### Notifications
- **Email**: HTML digest via Gmail SMTP (free)
- **WhatsApp**: Message logged to console for manual sending
  - Can integrate Meta WhatsApp Cloud API later (1000 free conversations/month)

## 🗄️ Database Schema

### Tables
- `tenders` - Scraped tender data with eligibility JSON
- `users` - User profiles, preferences, subscriptions
- `digest_log` - Email/WhatsApp send history
- `user_tender_actions` - User interactions (applied/watching/skip)

Run migrations:
```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

## ⏰ Daily Pipeline

Runs at 6:00 AM IST automatically:

1. **6:00 AM** - Scrape CPPP and GeM portals
2. **6:30 AM** - Extract text from new tender PDFs
3. **7:00 AM** - Parse eligibility criteria (rule-based)
4. **7:30 AM** - Match tenders to user profiles
5. **8:00 AM** - Send email digests to users

Manual trigger:
```bash
python -c "from app.workers.daily_job import run_daily_pipeline; import asyncio; asyncio.run(run_daily_pipeline())"
```

## 🐳 Docker Deployment

### Local Docker

```bash
docker-compose up -d
```

### Railway.app

1. Push code to GitHub
2. Connect repo in Railway dashboard
3. Add PostgreSQL plugin
4. Add Redis plugin (optional)
5. Set environment variables
6. Deploy!

See `railway.toml` and `backend/Dockerfile` for configuration.

## 🔐 Security Notes

- Use strong passwords for database
- Enable HTTPS in production
- Keep `.env` file out of version control
- Rotate API keys regularly
- Implement rate limiting on public endpoints

## 📈 Scaling Up (When You Have Revenue)

Optional paid upgrades:
1. **Meta WhatsApp Cloud API** - ₹0 for first 1000 conversations/month
2. **SendGrid/Mailgun** - Better email deliverability
3. **Bright Data proxies** - More reliable scraping at scale
4. **AWS Textract** - Better OCR for complex PDFs
5. **Claude/OpenAI API** - More accurate eligibility parsing

## 🛠️ Development

### Running Tests

```bash
pytest backend/tests/
```

### Code Style

```bash
black backend/app/
flake8 backend/app/
```

### Adding New Portals

1. Create `backend/app/scrapers/state/<state_name>.py`
2. Extend `BaseScraper` class
3. Implement `scrape()` method
4. Add to daily pipeline in `daily_job.py`

## 📝 License

MIT License - Feel free to use for commercial projects.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📞 Support

For issues or questions, open a GitHub issue.

---

**Built with ❤️ for Indian entrepreneurs**

*GovTender Scout helps small businesses discover government opportunities without breaking the bank.*
