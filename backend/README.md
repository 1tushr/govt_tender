# GovTender Scout - Backend

AI-powered government tender matching platform for Indian businesses.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── models/          # Mongoose models (User, Tender)
│   ├── routes/          # API route handlers
│   │   ├── auth.js      # Authentication endpoints
│   │   ├── tenders.js   # Tender CRUD operations
│   │   ├── users.js     # User profile & dashboard
│   │   └── notifications.js # Email/WhatsApp alerts
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   │   └── seed.js      # Database seeding
│   └── server.js        # Express app entry point
├── uploads/             # File uploads directory
├── .env                 # Environment variables
├── .env.example         # Environment template
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tenders
- `GET /api/tenders` - List all tenders (with filters)
- `GET /api/tenders/expiring` - Get expiring soon tenders
- `GET /api/tenders/:id` - Get single tender
- `GET /api/tenders/stats/overview` - Get statistics
- `POST /api/tenders/:id/view` - Mark as viewed
- `POST /api/tenders/:id/apply` - Mark as applied

### Users
- `PUT /api/users/profile` - Update profile
- `GET /api/users/recommendations` - Get personalized recommendations
- `GET /api/users/dashboard` - Get dashboard data

### Notifications
- `POST /api/notifications/send-email` - Send email
- `POST /api/notifications/send-whatsapp` - Send WhatsApp
- `POST /api/notifications/bulk-alert` - Bulk alerts

## 🧪 Test Credentials

After running `npm run seed`:

**Admin User:**
- Email: `admin@govtenderscout.in`
- Password: `admin123`

**Test User:**
- Email: `test@example.com`
- Password: `test1234`

## 🛠️ Development

```bash
# Run in watch mode
npm run dev

# Only seed database
npm run seed

# Production start
npm start
```

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** helmet, cors, rate-limiting
- **Email:** Nodemailer / Resend
- **WhatsApp:** Twilio API
- **Scraping:** Cheerio, Puppeteer (optional)

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Rate limiting on all API routes
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- MongoDB injection prevention

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `PORT` | Server port | 5000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `EMAIL_PROVIDER` | smtp or resend | smtp |
| `TWILIO_*` | Twilio credentials | - |

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Use MongoDB Atlas or production MongoDB
3. Configure real email (Resend/SendGrid)
4. Set up Twilio for WhatsApp
5. Deploy to Vercel, Railway, or AWS

## 📄 License

MIT

---

Made with ❤️ in India 🇮🇳
