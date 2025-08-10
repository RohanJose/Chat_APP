#!/bin/bash

echo "🚀 Setting up Stranger Chat..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Create environment files if they don't exist
if [ ! -f "backend/config.env" ]; then
    echo "📝 Creating backend config.env..."
    cat > backend/config.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stranger-chat
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NODE_ENV=development
EOF
    echo "⚠️  Please update backend/config.env with your actual credentials"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env..."
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
EOF
    echo "⚠️  Please update frontend/.env with your actual LiveKit URL"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/config.env with your MongoDB URI and LiveKit credentials"
echo "2. Update frontend/.env with your LiveKit URL"
echo "3. Run 'npm run dev' to start the application"
echo ""
echo "For detailed instructions, see README.md"
