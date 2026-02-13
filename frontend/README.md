# InsightEngine Frontend

React + Vite + Tailwind CSS frontend for the InsightEngine autonomous research platform.

## Features

- Modern, responsive UI with Tailwind CSS
- Real-time WebSocket updates
- Interactive agent activity dashboard
- Live research stream visualization
- Draft preview with citations
- PDF report download
- User authentication

## Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file (optional):
```bash
# Create .env file
VITE_API_URL=http://localhost:8000
```

3. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable React components
│   │   ├── AgentActivity.jsx
│   │   ├── SearchStream.jsx
│   │   ├── DraftPreview.jsx
│   │   └── NewResearchModal.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── ResearchSession.jsx
│   ├── services/        # API and state management
│   │   ├── api.js
│   │   └── store.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Key Components

### Pages

- **Login** - User authentication
- **Register** - New user registration
- **Dashboard** - List all research sessions
- **ResearchSession** - Live research monitoring and results

### Components

- **AgentActivity** - Real-time display of agent work
- **SearchStream** - Shows search queries and findings
- **DraftPreview** - Preview of drafted report sections
- **NewResearchModal** - Create new research session

### Services

- **API Service** - Axios-based API client with interceptors
- **WebSocket Service** - Real-time communication
- **Zustand Store** - State management for auth and research

## Features in Detail

### Real-Time Updates

The application uses WebSocket connections to receive real-time updates:
- Agent status changes
- Search queries performed
- Findings discovered
- Draft sections created
- Quality reviews completed

### Agent Visualization

Different agents are color-coded:
- **Manager** (Purple) - Creates research plan
- **Researcher** (Blue) - Gathers data
- **Writer** (Green) - Synthesizes content
- **Critique** (Orange) - Reviews quality

### Authentication Flow

1. User registers or logs in
2. JWT token stored in localStorage
3. Token automatically attached to API requests
4. Protected routes require authentication

## Styling

The application uses Tailwind CSS with a custom theme:
- Primary color: Blue (#3b82f6)
- Custom components defined in CSS
- Responsive design with mobile-first approach

## Development Tips

### Hot Module Replacement

Vite provides fast HMR for quick development iterations.

### Custom Hooks

Create custom hooks in `src/hooks/` for reusable logic.

### Environment Variables

Prefix environment variables with `VITE_` to expose them to the app:
```
VITE_API_URL=http://localhost:8000
```

## Deployment

### Netlify/Vercel

```bash
npm run build
# Deploy the dist folder
```

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
