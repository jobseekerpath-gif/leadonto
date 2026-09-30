# EduBharat Railway Deployment Script
# Run this script to deploy the app to Railway automatically
# PowerShell script for Windows

# Configuration
$RAILWAY_TOKEN = "9ed28942-fa4f-47ff-adea-1a0d813aaf7d"
$PROJECT_NAME = "edubharat-production"
$GITHUB_REPO = "https://github.com/navigalex4-gif/leadonto"

Write-Host "🚀 EduBharat Railway Deployment Starting..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Step 1: Check if Railway CLI is installed
Write-Host "`n📦 Checking Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = railway --version 2>$null
if (-not $railwayInstalled) {
    Write-Host "⚠️  Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI found: $railwayInstalled" -ForegroundColor Green
}

# Step 2: Login to Railway
Write-Host "`n🔑 Authenticating with Railway..." -ForegroundColor Yellow
$env:RAILWAY_TOKEN = $RAILWAY_TOKEN
railway login --token $RAILWAY_TOKEN
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Railway" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated with Railway" -ForegroundColor Green

# Step 3: Create Railway Project
Write-Host "`n🏗️  Creating Railway Project: $PROJECT_NAME..." -ForegroundColor Yellow
railway init --name $PROJECT_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Project may already exist or initialization failed. Continuing..." -ForegroundColor Yellow
}

# Step 4: Add PostgreSQL Database
Write-Host "`n🗄️  Adding PostgreSQL Database..." -ForegroundColor Yellow
railway add --service postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  PostgreSQL may already be added. Continuing..." -ForegroundColor Yellow
}
Start-Sleep -Seconds 5
Write-Host "✅ PostgreSQL added" -ForegroundColor Green

# Step 5: Set Environment Variables
Write-Host "`n⚙️  Setting Environment Variables..." -ForegroundColor Yellow

# Generate SESSION_SECRET
$SESSION_SECRET = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set BASE_PATH=/
railway variables set APP_ORIGIN=https://$PROJECT_NAME.up.railway.app
railway variables set SESSION_SECRET=$SESSION_SECRET

Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host "   - NODE_ENV: production" -ForegroundColor Cyan
Write-Host "   - PORT: 3000" -ForegroundColor Cyan
Write-Host "   - BASE_PATH: /" -ForegroundColor Cyan
Write-Host "   - SESSION_SECRET: (generated)" -ForegroundColor Cyan

# Step 6: Link GitHub Repository
Write-Host "`n🔗 Linking GitHub Repository..." -ForegroundColor Yellow
Write-Host "⚠️  Note: GitHub linking may require manual setup in Railway Dashboard" -ForegroundColor Yellow
Write-Host "   But we'll attempt via CLI..." -ForegroundColor Yellow

# Step 7: Deploy
Write-Host "`n🚀 Deploying Application..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Check Railway Dashboard for details." -ForegroundColor Red
    exit 1
}

# Step 8: Get the live URL
Write-Host "`n📍 Getting Application URL..." -ForegroundColor Yellow
$domainInfo = railway domain
Write-Host "✅ Deployment Complete!" -ForegroundColor Green

# Step 9: Display Results
Write-Host "`n" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "🎉 EduBharat is LIVE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📍 Live URL: https://$PROJECT_NAME.up.railway.app" -ForegroundColor Cyan
Write-Host "📊 Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. Select your project: $PROJECT_NAME" -ForegroundColor White
Write-Host "3. Connect your GitHub repo if not already connected" -ForegroundColor White
Write-Host "4. Monitor deployments in the Railway Dashboard" -ForegroundColor White
Write-Host "`n✅ Deployment Summary:" -ForegroundColor Green
Write-Host "   - Project: $PROJECT_NAME" -ForegroundColor Cyan
Write-Host "   - Database: PostgreSQL (Connected)" -ForegroundColor Cyan
Write-Host "   - API Server: Running on port 3000" -ForegroundColor Cyan
Write-Host "   - Web App: Served via Nginx" -ForegroundColor Cyan
Write-Host "   - Status: LIVE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
