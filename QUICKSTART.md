# EduBharat - Quick Railway Setup

## What's Included

✅ **Dockerfile** - Optimized multi-stage build for production
✅ **railway.json** - Railway configuration
✅ **RAILWAY_DEPLOYMENT.md** - Complete deployment guide
✅ **deploy-railway.sh** - Linux/Mac deployment script
✅ **deploy-railway.bat** - Windows deployment script

## Quick Start (5 minutes)

### 1. Create Railway Account
- Go to https://railway.app
- Sign up (free tier available)
- Create a new project

### 2. Get API Token
- Railway Dashboard → Account → Tokens
- Generate a new token
- Copy the token

### 3. Set Environment Variables

In Railway Dashboard → Variables, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/dbname
SESSION_SECRET=<run: openssl rand -base64 32>
APP_ORIGIN=https://your-app.railway.app
PUBLIC_APP_ORIGIN=https://your-app.railway.app
```

### 4. Deploy via GitHub (Recommended)

**Option A: Via GitHub**
1. Push this code to GitHub
2. Go to Railway Dashboard
3. Create New Project → GitHub
4. Select your repo
5. Railway auto-deploys on every push ✨

**Option B: Via Railway CLI**
```bash
npm install -g @railway/cli
railway login --token YOUR_TOKEN_HERE
cd /path/to/leadonto
railway up
```

**Option C: Run Script**
- Windows: Double-click `deploy-railway.bat`
- Mac/Linux: Run `bash deploy-railway.sh`

## Database Setup

Railway provides PostgreSQL automatically:

1. In your project dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway creates `DATABASE_URL` automatically ✅

## After Deployment

- **View Logs**: `railway logs --follow`
- **Get URL**: `railway open`
- **Check Status**: `railway status`
- **View Metrics**: Railway Dashboard → Monitoring

## Common Issues

| Issue | Solution |
|-------|----------|
| "DATABASE_URL not found" | Add PostgreSQL service or set DATABASE_URL manually |
| "SESSION_SECRET required" | Generate with `openssl rand -base64 32` and add to variables |
| "Build fails" | Check logs: `railway logs --follow` |
| "Port errors" | Railway auto-assigns PORT, don't hardcode it |

## Architecture

```
┌─────────────────────────────────────┐
│         Railway Container           │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Express API Server (3000)   │   │
│  ├──────────────────────────────┤   │
│  │  - REST API endpoints        │   │
│  │  - WebSocket connections     │   │
│  │  - Session management        │   │
│  │  - Static file serving       │   │
│  └──────────────────────────────┘   │
│           │                         │
│           ├─→ React Frontend (dist) │
│           └─→ Database (PostgreSQL) │
│                                     │
└─────────────────────────────────────┘
```

## Monitoring & Scaling

Railway Dashboard provides:
- Real-time logs
- CPU/Memory usage
- Request metrics
- Error tracking
- Auto-scaling options

## Custom Domain

1. Railway Dashboard → Domain
2. Add your custom domain
3. Update DNS records as shown

## Rollback

If something breaks:
1. Railway Dashboard → Deployments
2. Click previous version
3. Click "Redeploy"

## Support

- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Project Issues: Check GitHub Issues

## What Gets Deployed

- ✅ API Server (Node.js/Express)
- ✅ Web App (React/Vite - compiled to static files)
- ✅ Database migrations (automatic)
- ❌ Mobile App (separate Expo deployment)

---

**Ready?** Pick an option above and deploy! 🚀
