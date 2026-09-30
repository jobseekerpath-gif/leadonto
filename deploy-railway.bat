@echo off
setlocal enabledelayedexpansion

echo 🚀 EduBharat Railway Deployment Script
echo ========================================

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    call npm install -g @railway/cli
)

REM Check if in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Get Railway token from user
set /p RAILWAY_TOKEN="Enter your Railway API token (from https://railway.app/account/tokens): "

echo.
echo 📋 Step 1: Authenticating with Railway...
call railway login --token "%RAILWAY_TOKEN%"
if %errorlevel% neq 0 (
    echo ❌ Failed to authenticate with Railway
    exit /b 1
)

echo ✅ Authenticated

echo.
echo 📋 Step 2: Creating/connecting Railway project...
call railway init --name "edubharat"

echo.
echo ⚙️  Step 3: Setting up environment variables...
echo.
echo You need to set these environment variables in Railway:
echo.
echo REQUIRED:
echo   - NODE_ENV=production
echo   - DATABASE_URL=postgresql://user:password@host:port/dbname
echo   - SESSION_SECRET=^<generate with: openssl rand -base64 32^>
echo.
echo OPTIONAL (if using):
echo   - APP_ORIGIN=https://your-domain.com
echo   - GOOGLE_OAUTH_CLIENT_ID=...
echo   - ANTHROPIC_API_KEY=...
echo   - etc.
echo.
pause

echo.
echo 📋 Step 4: Deploying to Railway...
call railway up

echo.
echo ✅ Deployment complete!
echo.
echo 📚 Next steps:
echo   1. Check deployment status: railway status
echo   2. View logs: railway logs --follow
echo   3. Get your app URL: railway open
echo.
