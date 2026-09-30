@echo off
REM EduBharat Railway Deployment - One Click Deploy
REM This script will deploy your app to Railway automatically

setlocal enabledelayedexpansion

set RAILWAY_TOKEN=9ed28942-fa4f-47ff-adea-1a0d813aaf7d
set PROJECT_NAME=edubharat-production
set GITHUB_REPO=https://github.com/navigalex4-gif/leadonto

echo.
echo ================================================
echo   EduBharat Railway Deployment Starting
echo ================================================
echo.

REM Step 1: Install Railway CLI if not present
echo [1/7] Checking Railway CLI...
railway --version >nul 2>&1
if errorlevel 1 (
    echo Installing Railway CLI...
    call npm install -g @railway/cli
    if errorlevel 1 (
        echo ERROR: Failed to install Railway CLI
        pause
        exit /b 1
    )
)
echo ✓ Railway CLI ready
echo.

REM Step 2: Login to Railway
echo [2/7] Authenticating with Railway...
set RAILWAY_TOKEN=%RAILWAY_TOKEN%
call railway login --token %RAILWAY_TOKEN%
if errorlevel 1 (
    echo ERROR: Failed to authenticate with Railway
    pause
    exit /b 1
)
echo ✓ Authenticated
echo.

REM Step 3: Create Project
echo [3/7] Creating Railway Project...
call railway init --name %PROJECT_NAME%
echo ✓ Project created or already exists
echo.

REM Step 4: Add PostgreSQL
echo [4/7] Adding PostgreSQL Database...
call railway add --service postgres
timeout /t 5 /nobreak
echo ✓ PostgreSQL added
echo.

REM Step 5: Set Environment Variables
echo [5/7] Setting Environment Variables...
call railway variables set NODE_ENV=production
call railway variables set PORT=3000
call railway variables set BASE_PATH=/
call railway variables set APP_ORIGIN=https://%PROJECT_NAME%.up.railway.app
call railway variables set SESSION_SECRET=supersecret-change-in-dashboard-later
echo ✓ Environment variables configured
echo.

REM Step 6: Deploy
echo [6/7] Deploying Application...
echo This may take 5-10 minutes...
call railway up
if errorlevel 1 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)
echo ✓ Deployment successful
echo.

REM Step 7: Success
echo [7/7] Finalizing...
echo.
echo ================================================
echo   ✓ EduBharat is LIVE!
echo ================================================
echo.
echo Dashboard: https://railway.app/dashboard
echo App URL: https://%PROJECT_NAME%.up.railway.app
echo.
echo Next: Open Railway Dashboard to configure GitHub integration
echo.
pause
