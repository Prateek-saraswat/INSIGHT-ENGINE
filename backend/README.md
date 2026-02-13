# InsightEngine Backend

FastAPI-based backend for the InsightEngine autonomous research platform.

## Features

- Multi-agent AI research orchestration using LangGraph
- Real-time WebSocket streaming
- MongoDB for data persistence
- JWT authentication
- Professional PDF report generation
- RESTful API

## Setup

### Prerequisites

- Python 3.9+
- MongoDB (local or cloud)
- OpenAI API key

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and add your:
- MongoDB connection string
- OpenAI API key
- Secret key for JWT

4. Run the server:
```bash
chmod +x run.sh
./run.sh
```

Or directly:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/           # API routes
│   │   ├── auth.py
│   │   ├── research.py
│   │   └── websocket.py
│   ├── core/          # Core configuration
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/        # Pydantic models
│   │   └── schemas.py
│   ├── services/      # Business logic
│   │   ├── agents.py
│   │   ├── pdf_generator.py
│   │   └── research_service.py
│   └── main.py        # FastAPI app
├── requirements.txt
└── .env.example
```

## Key Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Research
- `POST /api/research/sessions` - Create research session
- `GET /api/research/sessions` - List user sessions
- `GET /api/research/sessions/{id}` - Get session details
- `GET /api/research/sessions/{id}/download` - Download report

### WebSocket
- `WS /ws/research/{session_id}` - Real-time research updates

## Multi-Agent System

The system uses LangGraph to orchestrate four specialized agents:

1. **Manager Agent** - Creates research plan
2. **Researcher Agent** - Gathers web data
3. **Writer Agent** - Synthesizes content
4. **Critique Agent** - Reviews and ensures quality

## Environment Variables

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=insightengine
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:3000"]
```

## Testing

Run tests:
```bash
pytest
```

## Production Deployment

For production:
1. Set strong SECRET_KEY
2. Use production MongoDB
3. Enable HTTPS
4. Set proper CORS origins
5. Use gunicorn with uvicorn workers:

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
