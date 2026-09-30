# 🚀 Deploy EduBharat to Railway - QUICK START

## Option 1: Deploy via Railway Dashboard (Easiest - No CLI needed)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up (or log in if you have account)

### Step 2: Create New Project
1. Click "Create New Project"
2. Select "Deploy from GitHub"
3. Connect your GitHub account
4. Select repository: `navigalex4-gif/leadonto`

### Step 3: Add PostgreSQL Database
1. Click "Add Service"
2. Select "PostgreSQL"
3. Railway will create database automatically
4. Copy the `DATABASE_URL` connection string

### Step 4: Configure Environment Variables
In Railway Dashboard → Project → Service (leadonto) → Variables:

```
DATABASE_URL=<copied-from-postgres>
SESSION_SECRET=<generate-below>
NODE_ENV=production
PORT=3000
APP_ORIGIN=https://{your-railway-domain}
BASE_PATH=/
```

**Generate SESSION_SECRET** (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy
1. Click "Deploy" button in Railway dashboard
2. Wait 5-10 minutes for build and deployment
3. Get your live URL from Railway → Deployments

---

## Option 2: Deploy via Railway CLI (For developers)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login with Your Token
```bash
railway login --token 9ed28942-fa4f-47ff-adea-1a0d813aaf7d
```

### Step 3: Link GitHub Repo
```bash
cd leadonto
railway init
# Select: "Deploy from GitHub"
# Select: navigalex4-gif/leadonto
```

### Step 4: Add PostgreSQL
```bash
railway add
# Select: PostgreSQL
```

### Step 5: Set Environment Variables
```bash
railway variables set SESSION_SECRET=<your-generated-secret>
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set APP_ORIGIN=https://your-app.railway.app
railway variables set BASE_PATH=/
```

### Step 6: Deploy
```bash
railway up
```

Wait for deployment, then:
```bash
railway logs
```

Get your live URL:
```bash
railway domains
```

---

## Environment Variables Reference

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Auto from PostgreSQL |
| `SESSION_SECRET` | `<32-char-random-string>` | Generate with command above |
| `NODE_ENV` | `production` | Required for production |
| `PORT` | `3000` | Default Railway port |
| `APP_ORIGIN` | `https://your-app.railway.app` | Your deployed URL |
| `BASE_PATH` | `/` | Web app base path |

---

## After Deployment

### Test Your App
```bash
# API health check
curl https://your-app.railway.app/api/health

# Web app
Visit https://your-app.railway.app
```

### View Logs
```bash
railway logs
# Or in Dashboard → Deployments → Logs
```

### Database Access
```bash
# View PostgreSQL connection
railway variables get DATABASE_URL

# Or in Dashboard → PostgreSQL → Connect
```

---

## Troubleshooting

### "Build failed"
- Check logs: Railway Dashboard → Deployments → Build Logs
- Ensure `pnpm` is installed (monorepo uses pnpm)
- Check `package.json` build scripts

### "App crashing"
- Check logs for errors
- Verify `DATABASE_URL` is set correctly
- Ensure `SESSION_SECRET` is at least 32 characters
- Check `NODE_ENV=production`

### "Port already in use"
- Railway assigns PORT automatically via environment variable
- Make sure app uses `process.env.PORT`

### Database connection error
- Get fresh `DATABASE_URL` from Railway PostgreSQL service
- Test connection string locally first
- Run migrations if needed

---

## What Gets Deployed

✅ **API Server** (Node.js/Express)
- Port 3000
- WebSocket support
- Google Cloud APIs
- Anthropic SDK
- Session storage in PostgreSQL

✅ **Web App** (React/Vite)
- Static files served from `/`
- Built assets cached
- API proxied to backend

✅ **Database** (PostgreSQL)
- Session storage
- User data persistence
- Auto-created tables

---

## Getting Help

1. Check Railway docs: https://docs.railway.app
2. View deployment logs in Railway dashboard
3. Test locally first: `pnpm run dev`

**Your Railway Token:** `9ed28942-fa4f-47ff-adea-1a0d813aaf7d`

**GitHub Repo:** https://github.com/navigalex4-gif/leadonto

**Start Deploying Now!** 🎉
