import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const researchApi = {
  // Start a new research session
  startResearch: async (topic, userId, constraints = null, scope = null) => {
    const response = await api.post('/api/research/start', {
      topic,
      user_id: userId,
      constraints,
      scope,
    });
    return response.data;
  },

  // Get session details
  getSession: async (sessionId) => {
    const response = await api.get(`/api/research/session/${sessionId}`);
    return response.data;
  },

  // Approve research plan
  approvePlan: async (sessionId, approved, modifications = null) => {
    const response = await api.post('/api/research/approve', {
      session_id: sessionId,
      approved,
      modifications,
    });
    return response.data;
  },

  // Get user's sessions
  getUserSessions: async (userId) => {
    const response = await api.get(`/api/research/sessions/${userId}`);
    return response.data;
  },

  // Download report
  downloadReport: (sessionId) => {
    return `${API_BASE_URL}/api/research/download/${sessionId}`;
  },

  // Create WebSocket connection
  createWebSocket: (sessionId) => {
    return new WebSocket(`${WS_BASE_URL}/api/research/stream/${sessionId}`);
  },
};

export default api;
