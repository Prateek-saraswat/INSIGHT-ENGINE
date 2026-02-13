import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authApi.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, username, password, confirmPassword) => {
    setError(null);
    
    // Validation
    if (!email || !username || !password || !confirmPassword) {
      return { success: false, error: 'All fields are required' };
    }
    
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }
    
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    
    if (username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    try {
      const response = await authApi.register(email, username, password, confirmPassword);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
