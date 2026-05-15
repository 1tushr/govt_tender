# GovTender Scout 🇮🇳

**AI-Powered Government Tender Matching Platform for Indian Businesses**

Stop manually checking portals. Let our AI do the heavy lifting and save 20+ hours per week.

![GovTender Scout](https://img.shields.io/badge/Status-Ready%20for%20Testing-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Made in India](https://img.shields.io/badge/Made%20with%20❤️%20in-India-orange)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- 500MB free disk space

### One-Command Setup (if MongoDB is running)
```bash
./startup.sh
```

### Manual Setup

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run seed
npm run dev
```

#### 2. Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:5000 | REST API |
| **API Health** | http://localhost:5000/health | Health check |

## 🔑 Test Credentials

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@govtenderscout.in | admin123 |
| User | test@example.com | test1234 |

## 📁 Project Structure

```
/workspace
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Mongoose schemas (User, Tender)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (monitoring, AI)
│   │   ├── middleware/     # Auth, validation
│   │   └── utils/          # Helpers, seeding
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/               # Next.js React Application
│   ├── app/
│   │   ├── page.tsx       # Landing page
│   │   ├── signup/        # Registration page
│   │   ├── login/         # Login page
│   │   └── dashboard/     # User dashboard (to be built)
│   └── package.json
│
└── startup.sh             # Automated setup script
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Tenders
- `GET /api/tenders` - List tenders with filters
- `GET /api/tenders/expiring` - Expiring soon (72h)
- `GET /api/tenders/:id` - Single tender details
- `GET /api/tenders/stats/overview` - Statistics

### Users
- `PUT /api/users/profile` - Update profile
- `GET /api/users/recommendations?userId=X` - Personalized tenders
- `GET /api/users/dashboard?userId=X` - Dashboard data

### Notifications
- `POST /api/notifications/send-email` - Send email
- `POST /api/notifications/send-whatsapp` - Send WhatsApp
- `POST /api/notifications/bulk-alert` - Bulk alerts

## 🎯 Features

### ✅ Implemented
- [x] User registration & authentication (JWT)
- [x] Indian mobile number validation
- [x] Password hashing with bcrypt
- [x] Tender database schema
- [x] Multi-portal support structure (45+ portals)
- [x] REST API with validation
- [x] Rate limiting & security headers
- [x] Email notifications (SMTP/Resend)
- [x] WhatsApp notifications (Twilio)
- [x] Sample data seeding
- [x] Landing page with pricing
- [x] Signup/Login pages
- [x] Monitoring service framework

### 🚧 To Be Completed
- [ ] Real portal scrapers (need portal-specific selectors)
- [ ] AI eligibility matching (Anthropic/OpenAI integration)
- [ ] User dashboard UI
- [ ] Payment integration (Razorpay/Stripe)
- [ ] Admin panel
- [ ] PDF tender document parser
- [ ] Advanced search & filters
- [ ] Export to CSV/PDF

## 🛠️ Tech Stack

**Backend:**
- Node.js 18+, Express.js
- MongoDB, Mongoose ODM
- JWT Authentication
- Winston Logger
- Node-Cron (scheduled jobs)
- Cheerio (HTML parsing)

**Frontend:**
- Next.js 14 (App Router)
- React 18, TypeScript
- Tailwind CSS
- Lucide Icons

**Services:**
- Email: Nodemailer / Resend
- WhatsApp: Twilio API
- AI: Anthropic Claude (optional)

## 📊 Supported Portals

The system supports monitoring from 45+ government portals including:

**Central:** CPPP, GeM, IREPS, Coal India, ISRO, DRDO, BEL, NTPC, SBI

**State:** Delhi, Maharashtra, Karnataka, Tamil Nadu, Rajasthan, MP, Kerala, Telangana, AP, Punjab, Haryana, Bihar, West Bengal, Odisha, Jharkhand, Assam, HP, Uttarakhand, CG

**Special:** Startup India, Smart Cities, NHAI, NIC

## 🔐 Security Features

- ✅ Password hashing (bcryptjs)
- ✅ JWT-based authentication
- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation (express-validator)
- ✅ MongoDB injection prevention

## 📝 Environment Variables

Create `/backend/.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/govtender-scout
JWT_SECRET=your-secret-key-change-in-production

# Optional (for notifications)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AI (optional)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## 🧪 Testing

### Test API Manually
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'

# Get tenders
curl http://localhost:5000/api/tenders
```

### Test with Postman/Insomnia
Import the API endpoints and use the test credentials.

## 🚀 Deployment

### Backend (Railway/Render/Heroku)
1. Set environment variables
2. Connect to MongoDB Atlas
3. Deploy from `/workspace/backend`

### Frontend (Vercel)
1. Connect GitHub repo
2. Set `NEXT_PUBLIC_API_URL`
3. Deploy from `/workspace/frontend`

### Production Checklist
- [ ] Change JWT_SECRET
- [ ] Use MongoDB Atlas
- [ ] Configure real email (Resend)
- [ ] Set up Twilio for WhatsApp
- [ ] Enable HTTPS
- [ ] Set up monitoring (UptimeRobot)
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@govtenderscout.in

---

**Made with ❤️ in India 🇮🇳**

Built for Indian MSMEs, startups, and businesses looking to win government contracts.
