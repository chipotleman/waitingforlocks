# LOCKS SOLD - Vercel Deployment Guide

## Quick Deployment Steps

### 1. Download/Export Your Code
- Download all files from this Replit project
- Make sure you have the `vercel.json` file included

### 2. Environment Variables
You'll need to set these in Vercel dashboard:

**Required:**
```
DATABASE_URL=your_postgresql_database_url
NODE_ENV=production
```

**Optional (if using PostgreSQL session store):**
```
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_postgres_database
```

### 3. Database Setup
**Option A: Keep Current Neon Database**
- Use the same DATABASE_URL from your current Replit project
- No changes needed - all your queue data will transfer

**Option B: New Database**
- Create a new PostgreSQL database (Neon, Supabase, Railway, etc.)
- Run: `npm run db:push` to create tables
- Update DATABASE_URL in Vercel

### 4. Deploy to Vercel

**Via Vercel CLI:**
```bash
npm install -g vercel
vercel --prod
```

**Via Vercel Dashboard:**
1. Go to vercel.com
2. Import from Git or upload folder
3. Add environment variables
4. Deploy

### 5. Custom Domain Setup
1. Go to your Vercel project dashboard
2. Settings → Domains
3. Add `waitingforlocks.com`
4. Update your domain's DNS to point to Vercel
5. Done! Your queue will be live at waitingforlocks.com

## Build Configuration

The project is already configured with:
- ✅ `vercel.json` - Handles routing and builds
- ✅ Build scripts - Frontend + backend bundling
- ✅ TypeScript support
- ✅ PostgreSQL database integration

## What Works After Deployment

- ✅ Queue management system
- ✅ Instagram boost verification
- ✅ Admin panel at `/admin` (password: MiamiHeat123)
- ✅ Real-time countdown timer
- ✅ Database persistence
- ✅ Custom domain support

## For Your 2pm Sale

1. Deploy to Vercel now (takes 2-3 minutes)
2. Set up `waitingforlocks.com` domain
3. Test the queue system
4. Share the link for your sale!

Your existing database data and queue entries will work immediately.