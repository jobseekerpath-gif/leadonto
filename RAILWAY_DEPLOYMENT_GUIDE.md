# EduBharat Railway Deployment - Complete Guide

## 📋 What This Project Is

**EduBharat** is a full-stack monorepo containing:
- **API Server** (Node.js/Express) - Backend REST API with WebSockets
- **Web App** (React/Vite) - Frontend dashboard
- **Mobile App** (React Native/Expo) - Mobile client
- **Database** (PostgreSQL) - Data persistence

## 🎯 Deployment Strategy

We're deploying **API Server + Web App** as a single containerized service on Railway.
- API serves on port 3000
- Web app compiled to static files served by API
- PostgreSQL database on Railway

---

## 🚀 DEPLOYMENT OPTIONS

### **Option 1: GitHub Auto-Deploy (RECOMMENDED) ⭐**

This is the easiest - Railway auto-deploys on every git push.

#### Step 1: Push to GitHub
```bash
cd /path/to/leadonto
git remote add origin https://github.com/YOUR_USERNAME/leadonto
git push -u origin main
```

#### Step 2: Connect Railway to GitHub
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub account
4. Select the `leadonto` repository
5. Railway auto-detects Dockerfile and starts building ✨

#### Step 3: Configure Environment Variables
In Railway Dashboard:
1. Click the project
2. Go to "Variables"
3. Add required variables (see below)
4. Click "Deploy"

**Result:** App is live at `https://your-app.railway.app` 🎉

---

### **Option 2: Railway CLI (Quick)**

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login & Deploy
```bash
railway login --token token-9ed28942-fa4f-47ff-adea-1a0d813aaf7d
cd /path/to/leadonto
railway up
```

#### Step 3: Add Variables
```bash
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=postgresql://...
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
```

---

### **Option 3: Use Provided Script**

#### Windows:
```bash
deploy-railway.bat
```

#### Mac/Linux:
```bash
bash deploy-railway.sh
```

The script guides you through the entire process.

---

## 📝 REQUIRED ENVIRONMENT VARIABLES

Add these in Railway Dashboard → Variables:

### Essential (MUST HAVE)
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/dbname
SESSION_SECRET=<generate: openssl rand -base64 32>
```

### Domain/Origin (Production)
```
APP_ORIGIN=https://your-domain.railway.app
PUBLIC_APP_ORIGIN=https://your-domain.railway.app
```

### Optional (if using these features)
```
# Google OAuth (for login)
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-secret

# Anthropic API (for AI features)
ANTHROPIC_API_KEY=your-key

# Payment Gateway (Cashfree)
CASHFREE_API_KEY=your-key

# Email Service
RESEND_API_KEY=your-key
```

---

## 🗄️ DATABASE SETUP

### Option 1: Railway PostgreSQL (Easiest)
1. In Railway Dashboard → "New Service"
2. Select "PostgreSQL"
3. Railway auto-creates `DATABASE_URL` variable ✅

### Option 2: External Database
Set `DATABASE_URL` manually:
```
postgresql://username:password@host.com:5432/edubharat
```

### Database Migrations
Migrations run automatically on deployment via:
- Drizzle ORM migration system
- Run on app startup if needed

---

## 🐳 HOW THE DOCKERFILE WORKS

The `Dockerfile` I created:

```dockerfile
# Stage 1: Build
- Uses Node 22 Alpine
- Installs pnpm (monorepo package manager)
- Installs dependencies
- Builds API server (esbuild)
- Builds web app (Vite)

# Stage 2: Runtime
- Uses Node 22 Alpine (small image)
- Copies built artifacts
- Exposes port 3000
- Starts API server
```

**Size:** ~400MB (Alpine-based, optimized)
**Build Time:** ~3-5 minutes

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] GitHub repo ready with code pushed
- [ ] Railway account created (https://railway.app)
- [ ] Railway API token generated
- [ ] PostgreSQL database created or external URL ready
- [ ] Environment variables configured:
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL set
  - [ ] SESSION_SECRET generated
  - [ ] APP_ORIGIN set
- [ ] Deployment triggered (via GitHub or CLI)
- [ ] Logs show "Server listening on port 3000"
- [ ] App accessible at public URL
- [ ] Test login & key features

---

## 🔍 MONITORING & DEBUGGING

### View Real-Time Logs
```bash
railway logs --follow
```

### Check Deployment Status
```bash
railway status
```

### View Metrics
Railway Dashboard → Monitoring
- CPU usage
- Memory usage
- Request count
- Error rate

### Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **Build fails** | Missing dependencies | Check `Dockerfile` build logs |
| **"DATABASE_URL not found"** | Env var not set | Add to Railway Variables |
| **"Port error"** | Hardcoded port | Railway auto-assigns PORT, app handles it |
| **"SESSION_SECRET required"** | Missing in production | Generate: `openssl rand -base64 32` |
| **Static files 404** | Web app not built | Check Dockerfile build stage |
| **High memory usage** | App leak or many connections | Scale up container or check logs |

---

## 🌐 CUSTOM DOMAIN

To use your own domain (e.g., api.edubharat.com):

1. Railway Dashboard → Domain
2. Click "New Domain"
3. Enter your domain
4. Update DNS records as shown:
   ```
   CNAME your-app.railway.app
   ```
5. SSL certificate auto-provisioned via Let's Encrypt ✅

---

## 📊 ARCHITECTURE AFTER DEPLOYMENT

```
┌────────────────────────────────────────────────┐
│           Railway Container                    │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────┐      │
│  │   Express API Server (Port 3000)     │      │
│  │  ┌────────────────────────────────┐  │      │
│  │  │  REST API Endpoints            │  │      │
│  │  │  - /api/auth                   │  │      │
│  │  │  - /api/content                │  │      │
│  │  │  - /api/journey                │  │      │
│  │  │  - /api/jobs                   │  │      │
│  │  │  etc.                          │  │      │
│  │  └────────────────────────────────┘  │      │
│  │  ┌────────────────────────────────┐  │      │
│  │  │  Static Files (React Frontend) │  │      │
│  │  │  served from /dist/public      │  │      │
│  │  └────────────────────────────────┘  │      │
│  │  ┌────────────────────────────────┐  │      │
│  │  │  WebSocket Connections         │  │      │
│  │  └────────────────────────────────┘  │      │
│  └──────────────────────────────────────┘      │
│           ↓                                     │
│  ┌──────────────────────────────────────┐      │
│  │  PostgreSQL Database                 │      │
│  │  (users, sessions, content, etc.)    │      │
│  └──────────────────────────────────────┘      │
│                                                │
└────────────────────────────────────────────────┘
        ↓ (HTTPS)
    Users Access:
    - https://app.railway.app/
    - API calls to same origin
```

---

## 🔄 DEPLOYMENT WORKFLOW

### After Initial Deployment

**For bug fixes & updates:**
1. Make code changes locally
2. Commit & push to GitHub
3. Railway auto-detects and deploys
4. Check logs: `railway logs --follow`
5. Done! 🚀

**For config/variable changes:**
1. Railway Dashboard → Variables
2. Update values
3. Click "Redeploy" (or next push triggers it)

**To rollback:**
1. Railway Dashboard → Deployments
2. Find previous working version
3. Click "Redeploy"
4. Instant rollback ⏮️

---

## 📱 MOBILE APP DEPLOYMENT

The mobile app (React Native/Expo) deploys separately:
```bash
cd artifacts/edubharat-mobile
eas build --platform all
```

See `artifacts/edubharat-mobile/eas.json` for config.

---

## 💰 RAILWAY PRICING

**Free Tier:**
- $5/month free credits
- Up to 5 projects
- Good for testing/staging

**Paid:**
- Pay-as-you-go (~$0.15/hour for small container)
- PostgreSQL: ~$10-50/month depending on usage

**To monitor costs:**
Railway Dashboard → Billing → Usage

---

## 🆘 GETTING HELP

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Project Issues:** Check GitHub issues
- **Error Logs:** `railway logs --follow`

---

## ✨ WHAT'S NEXT

After deployment:

1. ✅ **Test the app:**
   - Visit https://your-app.railway.app
   - Try logging in
   - Test key features

2. ✅ **Monitor:**
   - Set up log alerts
   - Check metrics regularly
   - Monitor error rate

3. ✅ **Optimize:**
   - Adjust container size if needed
   - Optimize database queries
   - Add caching layer

4. ✅ **Scale:**
   - Add more containers if needed
   - Set up auto-scaling

5. ✅ **Backup:**
   - Set up automated database backups
   - Test recovery procedures

---

## 🎉 YOU'RE DONE!

Your EduBharat app is now running on Railway! 

**Next:** Share the public URL and start inviting users! 🚀

For support, reach out or check the docs above.
