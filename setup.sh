#!/bin/bash

# InsightEngine Setup Script

set -e

echo "🚀 InsightEngine Setup"
echo "====================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not installed. Install Python 3.9+"
    exit 1
fi
echo "✅ Python: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Install Node.js 18+"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

echo ""
echo "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate and install
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Create .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  Edit backend/.env and add OPENAI_API_KEY"
    echo ""
fi

cd ..

echo ""
echo "Setting up frontend..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add OPENAI_API_KEY"
echo "2. Start MongoDB"
echo "3. Run: cd backend && source venv/bin/activate && python run.py"
echo "4. Run: cd frontend && npm run dev"
echo "5. Open http://localhost:3000"
echo ""
