# 🚀 DEPLOY TO RAILWAY NOW - ONE COMMAND

Your EduBharat app is ready to deploy. Follow these steps:

## ⚡ FASTEST WAY (Recommended)

### 1. Open PowerShell as Administrator
```powershell
Start-Process powershell -Verb RunAs
```

### 2. Run this ONE command:
```powershell
cd "C:\Users\DELL\Downloads\leadonto-upload\EduBharat-updated-appzip-1zip\leadonto"
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

That's it! The script will:
- ✅ Install Railway CLI
- ✅ Authenticate with your token
- ✅ Create project
- ✅ Add PostgreSQL database
- ✅ Set environment variables
- ✅ Deploy your app
- ✅ Make it LIVE

---

## 📊 What Happens During Deploy

1. **Authentication** (10 seconds)
   - Uses your token: `9ed28942-fa4f-47ff-adea-1a0d813aaf7d`

2. **Project Creation** (30 seconds)
   - Creates Railway project: `edubharat-production`

3. **Database Setup** (60 seconds)
   - PostgreSQL database auto-created
   - Connection string auto-generated

4. **Build & Deploy** (5-10 minutes)
   - Downloads repo from GitHub
   - Installs dependencies
   - Builds the app
   - Starts the server
   - Deploys to Railway

---

## ✅ When It's Done

You'll see:
```
✓ EduBharat is LIVE!
App URL: https://edubharat-production.up.railway.app
```

---

## 🔧 After Deployment

1. **Fix SESSION_SECRET** (Important!)
   - Go to: https://railway.app/dashboard
   - Select your project
   - Edit Variables → SESSION_SECRET
   - Change from `supersecret-change-in-dashboard-later` to something random
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **Connect GitHub** (Optional but recommended)
   - Dashboard → Project Settings → GitHub
   - Connect to `https://github.com/navigalex4-gif/leadonto`
   - Auto-redeploy on push

3. **Custom Domain** (If you have one)
   - Dashboard → Domains
   - Add your custom domain
   - Update DNS records

---

## 🐛 Bug Fixes Applied

The deployment includes fixes for:
- ✓ Missing error handlers
- ✓ Console.log → logger
- ✓ Environment validation
- ✓ Session store initialization
- ✓ CORS configuration for production
- ✓ Nginx reverse proxy setup

See `BUG_REPORT.md` for details.

---

## 📱 Your App Will Be Live At:

```
https://edubharat-production.up.railway.app
```

**API Endpoint:**
```
https://edubharat-production.up.railway.app/api
```

---

## 🚨 Troubleshooting

**If deployment fails:**
1. Check error message in console
2. Open https://railway.app/dashboard
3. Click your project → Logs
4. Share the error log for debugging

**Common issues:**
- Railway CLI not installed → Script installs it
- Token invalid → Double-check the token
- GitHub not connected → Manual setup needed (see dashboard)

---

## ✨ You're Ready!

```bash
# Just run this in PowerShell (as Admin):
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

Your app will be live in 10-15 minutes! 🎉
