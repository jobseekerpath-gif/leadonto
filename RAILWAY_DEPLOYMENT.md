# EduBharat Railway Deployment Guide

## Project Structure
This is a monorepo with:
- **API Server**: Node.js/Express backend (artifacts/api-server)
- **Web App**: React/Vite frontend (artifacts/edubharat)
- **Mobile App**: React Native/Expo (artifacts/edubharat-mobile) - not deployed to Railway
- **Shared Libraries**: Database, API client, etc. (lib/)

## Deployment Overview

The app is deployed as a single Docker container that:
1. Builds the API server (Express.js backend)
2. Builds the web app (React frontend)
3. Serves both from a single Express server
4. Frontend is served as static files from `/api-server/dist/public`

## Environment Variables Required

You must set these in Railway:

### Essential
- `NODE_ENV=production`
- `PORT=3000` (Railway assigns this automatically)
- `DATABASE_URL=postgresql://user:password@host:port/dbname`
- `SESSION_SECRET=<random-32+-char-string>`

### Recommended Origins
- `APP_ORIGIN=https://your-app-domain.com`
- `PUBLIC_APP_ORIGIN=https://your-app-domain.com`

### Optional (if using these services)
- `GOOGLE_OAUTH_CLIENT_ID=...`
- `GOOGLE_OAUTH_CLIENT_SECRET=...`
- `ANTHROPIC_API_KEY=...`
- `GOOGLE_CLOUD_PROJECT_ID=...`
- `CASHFREE_API_KEY=...`
- `DEEPGRAM_API_KEY=...`

## Step-by-Step Deployment

### 1. Create Railway Project
```bash
# If you don't have Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Configure Environment Variables

In Railway Dashboard:
1. Go to your project → Variables
2. Add all required environment variables
3. Especially important:
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `DATABASE_URL`: Your PostgreSQL connection string

### 3. Deploy

Option A - Via Railway CLI:
```bash
cd /path/to/leadonto
railway up
```

Option B - Via GitHub (Recommended):
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Railway auto-deploys on push

### 4. Add PostgreSQL Database (if needed)

In Railway Dashboard:
1. Click "Add Service"
2. Select "PostgreSQL"
3. Railway auto-creates `DATABASE_URL` variable

### 5. Verify Deployment

- Check Railway logs: `railway logs`
- Test API: `curl https://your-app.railway.app/api/health`
- Test web app: Visit `https://your-app.railway.app`

## Current Build Strategy

The Dockerfile:
1. Uses Node.js 20 Alpine (small, fast)
2. Installs pnpm for monorepo support
3. Builds both API server and web app
4. Copies production artifacts to final stage
5. Runs API server which serves both backend API and frontend

## Known Issues & Fixes

### Issue 1: Missing Environment Variables
**Error**: "Production requires DATABASE_URL and a SESSION_SECRET"
**Fix**: Add both to Railway variables

### Issue 2: Port Issues
**Error**: "PORT environment variable is required"
**Fix**: Railway automatically sets PORT, ensure it's in variables

### Issue 3: Database Connections
**Error**: "connect ECONNREFUSED"
**Fix**: Ensure DATABASE_URL is correct and PostgreSQL is running

### Issue 4: Session Store Initialization
**Error**: "connect-pg-simple table.sql not found"
**Status**: FIXED - Dockerfile copies table.sql to dist/

### Issue 5: CORS Issues
**Error**: "Origin is not allowed"
**Fix**: Set `APP_ORIGIN` and `PUBLIC_APP_ORIGIN` environment variables

## Rollback

To rollback to previous deployment:
1. Railway Dashboard → Deployments
2. Click the previous version
3. Click "Redeploy"

## Monitoring

Railway provides:
- Real-time logs
- CPU/Memory usage
- Network stats
- Error tracking

View via: `railway logs --follow`

## Scaling

To scale up:
1. Railway Dashboard → Services → Your App
2. Click "Scale"
3. Increase instance count or resources

## Custom Domain

1. Railway Dashboard → Domain
2. Add your custom domain
3. Update DNS records as instructed

## API Endpoints

After deployment, your app will be available at:
- Web: `https://your-railway-domain.railway.app`
- API: `https://your-railway-domain.railway.app/api`

## Support

For Railway-specific issues:
- Docs: https://docs.railway.app
- Support: https://railway.app/support

For app-specific issues:
- Check logs: `railway logs`
- Review database schema migrations if needed
- Verify all environment variables are set
