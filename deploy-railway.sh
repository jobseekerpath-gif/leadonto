#!/bin/bash
set -e

echo "🚀 EduBharat Railway Deployment Script"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if in the right directory
if [ ! -f "package.json" ] || [ ! -d "artifacts/api-server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Get Railway token from user
read -p "Enter your Railway API token (from https://railway.app/account/tokens): " RAILWAY_TOKEN
export RAILWAY_TOKEN

echo ""
echo "📋 Step 1: Authenticating with Railway..."
railway login --token "$RAILWAY_TOKEN" || {
    echo "❌ Failed to authenticate with Railway"
    exit 1
}

echo "✅ Authenticated"

echo ""
echo "📋 Step 2: Creating/connecting Railway project..."
railway init --name "edubharat" || true

echo ""
echo "⚙️  Step 3: Setting up environment variables..."
echo ""
echo "You need to set these environment variables in Railway:"
echo ""
echo "REQUIRED:"
echo "  - NODE_ENV=production"
echo "  - DATABASE_URL=postgresql://user:password@host:port/dbname"
echo "  - SESSION_SECRET=<generate with: openssl rand -base64 32>"
echo ""
echo "OPTIONAL (if using):"
echo "  - APP_ORIGIN=https://your-domain.com"
echo "  - GOOGLE_OAUTH_CLIENT_ID=..."
echo "  - ANTHROPIC_API_KEY=..."
echo "  - etc."
echo ""
read -p "Press Enter once you've added variables to Railway dashboard... "

echo ""
echo "📋 Step 4: Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Check deployment status: railway status"
echo "  2. View logs: railway logs --follow"
echo "  3. Get your app URL: railway open"
echo ""
