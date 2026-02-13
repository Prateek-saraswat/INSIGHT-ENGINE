# InsightEngine - Autonomous Research Platform

A sophisticated AI-powered research platform featuring multi-agent collaboration, real-time transparency, and self-correction mechanisms. Built with FastAPI, MongoDB, React, and Tailwind CSS.

## 🌟 Key Features

### Multi-Agent System
- **Manager Agent**: Strategic planning and task decomposition
- **Researcher Agent**: Real-time web data collection
- **Writer Agent**: Content synthesis and report generation
- **Critique Agent**: Quality control and iterative improvement

### Advanced Capabilities
- ✅ **Real-time Transparency**: Watch AI agents work through WebSocket streaming
- ✅ **Self-Correction Loop**: Automatic quality checking and revision cycles
- ✅ **Human-in-the-Loop**: Approve research plans before execution
- ✅ **Professional PDF Reports**: Structured output with citations
- ✅ **Research Traceability**: Complete audit trail of agent activities

## 🏗️ Architecture

```
Frontend (React + Tailwind)
    ↓ WebSocket + REST API
Backend (FastAPI)
    ↓
Multi-Agent System (LangGraph pattern)
    ↓
OpenAI GPT-4 + Web Research
    ↓
MongoDB (Session Storage)
    ↓
PDF Generation (ReportLab)
```

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB 4.4+
- OpenAI API Key

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Make sure MongoDB is running
# Start the backend
python run.py
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Access the Application

Open `http://localhost:3000` in your browser and start researching!

## 📚 Usage Guide

### Starting a Research Session

1. Enter a complex research topic
2. Optionally add constraints
3. Click "Start Research"
4. Watch the multi-agent system work in real-time

### Approving Research Plans

1. The Manager agent creates a structured plan
2. System pauses for your approval
3. Review the proposed sections
4. Approve or reject the plan

### Monitoring Progress

- Watch agent activities in real-time
- See search queries, sources found, and content being written
- Observe self-correction loops

### Downloading Reports

- Download professional PDF reports with citations

## 🔧 Configuration

### Backend (.env)

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=insightengine
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
```

## 📖 API Documentation

Swagger UI: `http://localhost:8000/docs`

## 🏛️ Project Structure

```
insightengine/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # Routes & WebSocket
│   │   ├── core/     # Config & database
│   │   ├── models/   # Schemas
│   │   └── services/ # Multi-agent system
│   └── requirements.txt
└── frontend/         # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── package.json
```

## 🎯 Key Differentiators

1. True multi-agent collaboration
2. Transparent reasoning visualization
3. Built-in quality assurance
4. Human oversight capabilities
5. Production-ready architecture

---

Built with FastAPI, React, MongoDB, and OpenAI GPT-4
