# Cricklytics Local Development Script for Windows

Write-Host "🏏 Starting Cricklytics Development Environment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "python")) {
    Write-Host "❌ Python is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ Node.js/npm is not installed" -ForegroundColor Red
    exit 1
}

# Backend setup
Write-Host "🚀 Setting up backend..." -ForegroundColor Green
Set-Location backend

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Initialize database
Write-Host "🗄️ Initializing database..." -ForegroundColor Yellow
python -c "from server import init_database; init_database()"

# Start backend in background
Write-Host "🌐 Starting backend server..." -ForegroundColor Green
$backend = Start-Process python -ArgumentList "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru

Set-Location ..

# Frontend setup
Write-Host "🎨 Setting up frontend..." -ForegroundColor Green
Set-Location frontend

# Install dependencies
Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Start frontend
Write-Host "🌐 Starting frontend server..." -ForegroundColor Green
$frontend = Start-Process npm -ArgumentList "start" -PassThru

Set-Location ..

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "🎯 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Wait for user input to stop
try {
    while ($true) {
        Start-Sleep 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
