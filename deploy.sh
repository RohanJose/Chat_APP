#!/bin/bash

echo "🚀 Deploying Stranger Chat App to Vercel + Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Prerequisites Check:${NC}"
echo "1. Make sure you have Railway CLI installed: npm install -g @railway/cli"
echo "2. Make sure you have Vercel CLI installed: npm install -g vercel"
echo "3. Make sure you're logged into both services"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✅ CLI tools are ready${NC}"
echo ""

echo -e "${BLUE}🔧 Step 1: Deploy Backend to Railway${NC}"
echo "This will deploy your Node.js backend to Railway"
echo ""

read -p "Press Enter to continue with Railway deployment..."

cd backend

# Deploy to Railway
echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
railway up

# Get the Railway URL
echo -e "${YELLOW}🔍 Getting Railway URL...${NC}"
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${RED}❌ Could not get Railway URL. Please check manually.${NC}"
    echo "You can find the URL in your Railway dashboard"
else
    echo -e "${GREEN}✅ Backend deployed to: ${RAILWAY_URL}${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}🔧 Step 2: Deploy Frontend to Vercel${NC}"
echo "This will deploy your React frontend to Vercel"
echo ""

read -p "Press Enter to continue with Vercel deployment..."

cd frontend

# Update environment variables with Railway URL
if [ ! -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}📝 Updating environment variables...${NC}"
    
    # Create .env.production with Railway URL
    cat > .env.production << EOF
REACT_APP_API_URL=${RAILWAY_URL}/api
REACT_APP_SOCKET_URL=${RAILWAY_URL}
REACT_APP_NODE_ENV=production
EOF
    
    echo -e "${GREEN}✅ Environment variables updated${NC}"
fi

# Deploy to Vercel
echo -e "${YELLOW}☁️  Deploying to Vercel...${NC}"
vercel --prod

cd ..

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update your Railway environment variables:"
echo "   - CORS_ORIGIN: Your Vercel frontend URL"
echo "   - MONGODB_URI: Your MongoDB Atlas connection string"
echo "   - NODE_ENV: production"
echo ""
echo "2. Update your Vercel environment variables:"
echo "   - REACT_APP_API_URL: ${RAILWAY_URL:-'Your Railway URL'}/api"
echo "   - REACT_APP_SOCKET_URL: ${RAILWAY_URL:-'Your Railway URL'}"
echo ""
echo "3. Test your deployed application!"
echo ""
echo -e "${YELLOW}🔗 Useful Links:${NC}"
echo "- Railway Dashboard: https://railway.app"
echo "- Vercel Dashboard: https://vercel.com"
echo "- MongoDB Atlas: https://cloud.mongodb.com"
