# LOCKS SOLD - Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Files Ready for Export:
- [x] Mobile countdown timer fixed
- [x] vercel.json configured
- [x] .vercelignore created
- [x] Build configuration optimized
- [x] All functionality tested

### Required Environment Variables:
```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

## 🚀 Deployment Steps

### 1. Export Project Files
Download these files from Replit:
- All `/client` folder contents
- All `/server` folder contents  
- All `/shared` folder contents
- `package.json` and `package-lock.json`
- `vercel.json`
- `.vercelignore`
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `drizzle.config.ts`

### 2. Deploy to Vercel
**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to vercel.com → New Project
2. Upload folder or connect Git repo
3. Add environment variables:
   - `DATABASE_URL`: (your current PostgreSQL URL)
   - `NODE_ENV`: production
4. Click Deploy

### 3. Add Custom Domain
1. Go to Project Settings → Domains
2. Add `waitingforlocks.com`
3. Follow DNS instructions
4. Wait 5-15 minutes for propagation

## 🔧 Technical Details

### Build Process:
- Frontend: Vite builds to `dist/public`
- Backend: ESBuild bundles to `dist/index.js`
- Vercel serves both automatically

### Database:
- Uses existing PostgreSQL database
- All queue data transfers automatically
- No migration needed

### Features Included:
- ✅ Queue management system
- ✅ Instagram boost (100 spots up)
- ✅ Admin panel at `/admin` (password: MiamiHeat123)
- ✅ Real-time countdown timer (mobile optimized)
- ✅ Email masking for privacy
- ✅ Responsive design

## ⏰ For Your 2pm Sale

Once deployed:
1. Test queue functionality at `waitingforlocks.com`
2. Verify admin panel access
3. Share the link for your drop
4. Monitor queue through admin dashboard

**Admin Access:**
- URL: `waitingforlocks.com/admin`
- Password: `MiamiHeat123`

Your queue system will be live and ready for the sale!