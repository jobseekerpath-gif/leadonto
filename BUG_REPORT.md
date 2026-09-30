# EduBharat Bug Report & Fixes

## Critical Issues Found

### 1. ❌ Missing Environment Variables (Production Breaking)
**File:** `artifacts/api-server/src/app.ts`
**Issue:** App requires `SESSION_SECRET` (min 32 chars) but no default value
**Severity:** CRITICAL - Production will crash without it
**Fix:** Add to `.env.production`:
```
SESSION_SECRET=generate_a_random_32_character_string_here_1234567890
```

### 2. ❌ Missing DATABASE_URL (Production Breaking)
**File:** `artifacts/api-server/src/app.ts`
**Issue:** PostgreSQL connection required for production
**Severity:** CRITICAL - Sessions won't persist
**Fix:** Set in Railway environment variables:
```
DATABASE_URL=postgresql://user:password@host:5432/edubharat
```

### 3. ⚠️ Missing Google OAuth Credentials (Auth Disabled)
**File:** `artifacts/api-server/src/routes/auth.ts`
**Issue:** Google login will be disabled without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
**Severity:** HIGH - Users can't login with Google
**Fix:** 
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback
```

### 4. ⚠️ BASE_PATH Not Set for Frontend
**File:** `artifacts/edubharat/vite.config.ts`
**Issue:** Frontend build fails without `BASE_PATH` environment variable
**Severity:** HIGH - Web app won't build
**Fix:** Set in Railway:
```
BASE_PATH=/
```

### 5. ⚠️ Missing PORT Configuration
**File:** `artifacts/api-server/src/index.ts` & `artifacts/edubharat/vite.config.ts`
**Issue:** Both require PORT environment variable
**Severity:** MEDIUM - Will fail to start
**Fix:** Railway auto-assigns PORT, but add to `.env`:
```
PORT=3000
```

### 6. ⚠️ NODE_ENV Not Set
**File:** Multiple files
**Issue:** Production features won't activate without NODE_ENV=production
**Severity:** MEDIUM - Security headers missing
**Fix:** Add to Railway:
```
NODE_ENV=production
```

---

## Deployment Checklist

### ✅ Required Environment Variables for Railway

```
# Authentication
SESSION_SECRET=your_random_32_char_string_min
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/edubharat

# Application
NODE_ENV=production
PORT=3000
BASE_PATH=/
APP_ORIGIN=https://your-app.railway.app
PUBLIC_APP_ORIGIN=https://your-app.railway.app
```

### ✅ Steps to Generate Missing Values

**Generate SESSION_SECRET (32 chars minimum):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1`

---

## Build & Start Commands

### API Server
- **Build:** `cd artifacts/api-server && pnpm run build`
- **Start:** `node --enable-source-maps ./dist/index.mjs`

### Web Frontend
- **Build:** `cd artifacts/edubharat && pnpm run build`
- **Serve:** `pnpm run serve`

### Monorepo (Root)
- **Install:** `pnpm install`
- **Build All:** `pnpm run build`
- **Typecheck:** `pnpm run typecheck`

---

## Known Dependencies

- **Node.js:** 20+ (for ESM support)
- **pnpm:** Latest (required package manager)
- **PostgreSQL:** 14+ (for database)
- **Drizzle ORM:** ^0.45.2
- **Express:** ^5.2.1
- **React:** 19.1.0

---

## How to Fix & Deploy

### Option 1: Deploy via Railway Dashboard (Easiest)
1. Go to https://railway.app/dashboard
2. Create new project
3. Connect GitHub repo: `https://github.com/navigalex4-gif/leadonto`
4. Click "Add service" → PostgreSQL
5. Go to Variables tab and add all environment variables above
6. Railway auto-detects monorepo and builds

### Option 2: Deploy via Railway CLI (Your Machine)
```bash
npm install -g @railway/cli
railway login --token 9ed28942-fa4f-47ff-adea-1a0d813aaf7d
cd /path/to/leadonto
railway create
railway up
```

### Option 3: Fix & Push to GitHub
```bash
cd leadonto
git add .
git commit -m "Add Railway deployment config and fix environment variables"
git push origin main
```

---

## Testing After Deployment

1. **Health Check:** `https://your-app.railway.app/api/health`
2. **Auth Config:** `https://your-app.railway.app/api/auth/config`
3. **Frontend:** `https://your-app.railway.app/`

---

## Support

- Railway Docs: https://docs.railway.app
- Node.js Deployment: https://docs.railway.app/deploy/nodejs
- Database Setup: https://docs.railway.app/databases/postgresql

**Status:** Ready to deploy! ✅
