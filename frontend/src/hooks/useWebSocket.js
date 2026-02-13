import { useEffect, useState, useCallback } from 'react';
import { researchApi } from '../services/api';

export const useWebSocket = (sessionId) => {
  const [updates, setUpdates] = useState([]);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const websocket = researchApi.createWebSocket(sessionId);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'history') {
        // Received historical updates
        setUpdates(data.updates);
      } else if (data.type === 'agent_update') {
        // Received new update
        setUpdates((prev) => [...prev, data.update]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    setWs(websocket);

    // Cleanup
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [sessionId]);

  return { updates, connected, ws };
};
