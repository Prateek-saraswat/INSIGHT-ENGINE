# InsightEngine - Architecture & Implementation Guide

## System Overview

InsightEngine is a production-ready autonomous research platform that demonstrates advanced AI orchestration through a multi-agent system. The platform combines FastAPI, MongoDB, React, and OpenAI GPT-4 to deliver a sophisticated research experience with real-time transparency.

## Core Architecture

### Three-Layer Design

```
┌─────────────────────────────────────┐
│   Frontend Layer (React + Tailwind) │
│   - User Interface                  │
│   - Real-time Updates (WebSocket)   │
│   - State Management                │
└──────────────┬──────────────────────┘
               │ HTTP/WebSocket
┌──────────────┴──────────────────────┐
│   Backend Layer (FastAPI)           │
│   - REST API Endpoints              │
│   - WebSocket Streaming             │
│   - Session Management              │
│   - PDF Generation                  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   AI Engine (Multi-Agent System)    │
│   - Manager Agent                   │
│   - Researcher Agent                │
│   - Writer Agent                    │
│   - Critique Agent                  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   External Services                 │
│   - OpenAI GPT-4                    │
│   - Web Search & Scraping           │
│   - MongoDB                         │
└─────────────────────────────────────┘
```

## Multi-Agent System

### Agent Roles & Responsibilities

#### 1. Manager Agent
- **Purpose**: Strategic planning and orchestration
- **Input**: User's research topic
- **Output**: Structured research plan with sections
- **Key Function**: Breaks complex topics into manageable subtasks

```python
Research Topic → Manager → [Section 1, Section 2, ...]
```

#### 2. Researcher Agent
- **Purpose**: Data collection from the web
- **Input**: Section topic and search queries
- **Output**: Citations with excerpts
- **Key Function**: Gathers authoritative sources

```python
Section Topic → Researcher → [Citation 1, Citation 2, ...]
```

#### 3. Writer Agent
- **Purpose**: Content synthesis
- **Input**: Research notes and citations
- **Output**: Coherent section content
- **Key Function**: Transforms data into readable prose

```python
Citations → Writer → Professional Section Content
```

#### 4. Critique Agent
- **Purpose**: Quality assurance
- **Input**: Written section
- **Output**: Quality assessment + feedback
- **Key Function**: Ensures accuracy and completeness

```python
Section → Critique → Pass/Fail + Feedback
```

### Agent Workflow

```
1. User submits topic
2. Manager creates plan
3. System pauses for approval ← HUMAN-IN-THE-LOOP
4. For each section:
   a. Researcher gathers data
   b. Writer creates content
   c. Critique reviews quality
   d. If quality issues: LOOP back to Writer
   e. If approved: Move to next section
5. Generate PDF report
6. Session complete
```

### Self-Correction Loop

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│ Writer  │────>│ Critique │────>│ Approve │
└─────────┘     └──────────┘     └─────────┘
     ▲                │                │
     │                │ Issues Found   │ Quality OK
     │                ▼                ▼
     │          ┌──────────┐      ┌────────┐
     └──────────│ Feedback │      │  Done  │
                └──────────┘      └────────┘
```

## Backend Implementation

### FastAPI Application Structure

```
app/
├── api/
│   ├── research.py      # REST endpoints
│   └── websocket.py     # WebSocket manager
├── core/
│   ├── config.py        # Settings
│   └── database.py      # MongoDB connection
├── models/
│   └── schemas.py       # Pydantic models
├── services/
│   ├── multi_agent.py   # AI agents
│   ├── research_service.py  # Orchestration
│   ├── pdf_service.py   # Report generation
│   └── web_research.py  # Web scraping
└── main.py              # Application entry
```

### Key Technologies

- **FastAPI**: Async Python web framework
- **Motor**: Async MongoDB driver
- **OpenAI**: GPT-4 for agent intelligence
- **ReportLab**: Professional PDF generation
- **BeautifulSoup**: Web content extraction
- **WebSockets**: Real-time client updates

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/research/start` | Start new session |
| GET | `/api/research/session/{id}` | Get session details |
| POST | `/api/research/approve` | Approve plan |
| GET | `/api/research/sessions/{user_id}` | List sessions |
| GET | `/api/research/download/{id}` | Download PDF |
| WS | `/api/research/stream/{id}` | Real-time updates |

## Frontend Implementation

### React Application Structure

```
src/
├── components/
│   ├── AgentActivityCard.jsx    # Agent update display
│   ├── StatusBadge.jsx          # Status indicator
│   ├── ResearchForm.jsx         # Input form
│   └── PlanApprovalDialog.jsx   # Approval UI
├── pages/
│   ├── Home.jsx                 # Landing page
│   └── ResearchDashboard.jsx    # Main dashboard
├── services/
│   └── api.js                   # Backend client
├── hooks/
│   └── useWebSocket.js          # WebSocket hook
└── utils/
    └── helpers.js               # Utilities
```

### Key Features

- **Real-time Updates**: WebSocket connection shows agent activities
- **Plan Approval**: Interactive UI for human oversight
- **Session History**: View and resume past research
- **Responsive Design**: Tailwind CSS for modern UI

### State Management

```javascript
Session State:
{
  id: string,
  topic: string,
  status: enum,
  plan: object,
  sections: array,
  agent_updates: array,
  final_report_path: string
}
```

## Database Schema

### MongoDB Collections

#### research_sessions

```javascript
{
  _id: ObjectId,
  user_id: string,
  topic: string,
  status: string,
  plan: {
    sections: array,
    research_questions: array,
    estimated_sources: number
  },
  plan_approved: boolean,
  sections: [{
    title: string,
    content: string,
    citations: array,
    revision_count: number
  }],
  agent_updates: [{
    agent: string,
    action: string,
    details: object,
    timestamp: datetime
  }],
  final_report_path: string,
  created_at: datetime,
  updated_at: datetime,
  completed_at: datetime
}
```

## Real-Time Communication

### WebSocket Flow

```
Client                  Server
  │                       │
  ├──── Connect ─────────>│
  │<─── History ──────────┤ (Send past updates)
  │                       │
  │     Agent Working     │
  │<─── Update ───────────┤ (Manager planning)
  │<─── Update ───────────┤ (Researcher found sources)
  │<─── Update ───────────┤ (Writer drafting)
  │<─── Update ───────────┤ (Critique reviewing)
  │                       │
  ├──── Ping ────────────>│
  │<─── Pong ─────────────┤
```

## PDF Report Generation

### Report Structure

```
1. Title Page
   - Topic
   - Date
   - Session ID

2. Executive Summary
   - Overview
   - Section count

3. Table of Contents
   - Linked sections

4. Sections (Multiple)
   - Title
   - Content
   - In-text citations

5. References
   - Numbered citations
   - URLs
   - Access dates
```

### ReportLab Usage

```python
from reportlab.platypus import SimpleDocTemplate, Paragraph

doc = SimpleDocTemplate(filepath)
story = [
    Paragraph("Title", title_style),
    Spacer(1, 0.3*inch),
    Paragraph("Content", body_style),
    PageBreak(),
    ...
]
doc.build(story)
```

## Deployment

### Local Development

```bash
# Backend
python run.py

# Frontend  
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

### Production Considerations

1. **Security**
   - Add authentication (JWT)
   - Secure MongoDB
   - Rate limiting
   - HTTPS

2. **Scalability**
   - Horizontal backend scaling
   - Redis for session management
   - CDN for frontend
   - Queue system (Celery) for long tasks

3. **Monitoring**
   - Application logs
   - Error tracking (Sentry)
   - Performance monitoring
   - Cost tracking (OpenAI usage)

## Key Design Decisions

### Why Multi-Agent?

- **Modularity**: Each agent has one responsibility
- **Maintainability**: Easy to update individual agents
- **Transparency**: Clear visibility into decision-making
- **Quality**: Built-in review process

### Why WebSocket?

- **Real-time**: Users see progress immediately
- **Trust**: Transparency builds confidence
- **Engagement**: Users stay connected to the process
- **Debugging**: Easy to trace agent activities

### Why MongoDB?

- **Flexibility**: Schema-less for evolving models
- **Performance**: Fast reads/writes for sessions
- **Scalability**: Easy horizontal scaling
- **JSON**: Natural fit for agent updates

## Performance Optimization

### Backend

- **Async Operations**: All I/O is non-blocking
- **Connection Pooling**: MongoDB connections reused
- **Caching**: Results cached where appropriate
- **Rate Limiting**: Prevents API abuse

### Frontend

- **Code Splitting**: Lazy load components
- **Memoization**: Cache expensive computations
- **Virtual Scrolling**: Handle large update lists
- **Debouncing**: Reduce unnecessary renders

## Testing Strategy

### Backend Tests

```python
# Unit tests for agents
test_manager_agent()
test_researcher_agent()
test_writer_agent()
test_critique_agent()

# Integration tests
test_full_research_workflow()
test_websocket_streaming()
test_pdf_generation()
```

### Frontend Tests

```javascript
// Component tests
test('ResearchForm submits correctly')
test('AgentActivityCard displays updates')

// Integration tests
test('Full research flow from input to download')
```

## Future Enhancements

1. **Advanced Features**
   - Multi-language support
   - Custom agent configurations
   - Collaborative research (multiple users)
   - Export formats (Markdown, DOCX)

2. **AI Improvements**
   - Fine-tuned models for specific domains
   - RAG (Retrieval-Augmented Generation)
   - Custom knowledge bases
   - Fact-checking integration

3. **Platform Features**
   - Teams and workspaces
   - Templates and presets
   - Analytics dashboard
   - API for integrations

## Conclusion

InsightEngine demonstrates a production-level implementation of multi-agent AI systems with:

- ✅ Clear separation of concerns
- ✅ Real-time user feedback
- ✅ Quality assurance mechanisms
- ✅ Scalable architecture
- ✅ Professional output

The platform serves as both a functional tool and a reference implementation for building sophisticated AI applications.

---

For questions or contributions, see README.md
