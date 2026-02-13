# InsightEngine - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- ✅ Python 3.9+
- ✅ Node.js 18+
- ✅ MongoDB 4.4+
- ✅ OpenAI API key

## Automated Setup

```bash
./setup.sh
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add OPENAI_API_KEY
```

### Frontend

```bash
cd frontend
npm install
```

### Run

**Terminal 1:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

### Access

Open `http://localhost:3000`

## First Research

1. Enter a topic
2. Start research
3. Approve plan
4. Download report

## Troubleshooting

- MongoDB not running? `mongod`
- Check API key in `.env`
- Clear cache: `rm -rf node_modules && npm install`

Happy researching! 🎯
