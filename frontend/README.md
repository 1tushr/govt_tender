# GovTender Scout - Frontend

Next.js 14 frontend for GovTender Scout platform.

## Setup

```bash
npm install
npm run dev
```

## Pages

- `/` - Landing page with features, pricing, and CTA
- `/signup` - User registration (to be implemented)
- `/dashboard` - Tender pipeline dashboard (to be implemented)
- `/profile` - User profile and preferences (to be implemented)
- `/billing` - Subscription management (to be implemented)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React icons

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```
