#!/bin/bash

# Cricklytics Local Development Script

echo "🏏 Starting Cricklytics Development Environment..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python; then
    echo "❌ Python is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Node.js/npm is not installed"
    exit 1
fi

# Backend setup
echo "🚀 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate || source venv/Scripts/activate

# Install dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️ Initializing database..."
python -c "from server import init_database; init_database()"

# Start backend in background
echo "🌐 Starting backend server..."
uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Start frontend
echo "🌐 Starting frontend server..."
npm start &
FRONTEND_PID=$!

cd ..

echo "✅ Development environment started!"
echo "🎯 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait
