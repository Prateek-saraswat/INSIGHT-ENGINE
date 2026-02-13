import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email, username, password, confirm_password) => {
    const response = await api.post('/api/auth/register', {
      email,
      username,
      password,
      confirm_password
    });
    return response.data;
  },
  
  logout: async () => {
    await api.post('/api/auth/logout');
  },
  
  getMe: async () => {
    const token = localStorage.getItem('token');
    const response = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

export const researchApi = {
  // Start a new research session
  startResearch: async (topic, user_id, constraints = null, scope = null) => {
    const response = await api.post('/api/research/start', {
      topic,
      user_id,
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

  // Get user's sessions (requires auth)
  getUserSessions: async (userId) => {
    const response = await api.get(`/api/research/sessions/${userId}`);
    return response.data;
  },

  // Download report
  downloadReport: (sessionId) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/research/download/${sessionId}`;
  },

  // Delete a research session
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/research/session/${sessionId}`);
    return response.data;
  },

  // Create WebSocket connection
  createWebSocket: (sessionId) => {
    const token = localStorage.getItem('token');
    return new WebSocket(`${WS_BASE_URL}/api/research/stream/${sessionId}`);
  },
};

export default api;
