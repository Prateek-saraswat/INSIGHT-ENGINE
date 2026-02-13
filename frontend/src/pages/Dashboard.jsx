import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, FileText, LogOut, Plus, Search, Settings } from 'lucide-react';
import ResearchForm from '../components/ResearchForm';
import StatusBadge from '../components/StatusBadge';
import { researchApi } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showResearchForm, setShowResearchForm] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated && user?._id) {
      loadSessions();
    }
  }, [user, authLoading, isAuthenticated]);

  const loadSessions = async () => {
    try {
      const data = await researchApi.getUserSessions(user._id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleStartResearch = async (formData) => {
    if (!user?._id) {
      alert('User not loaded. Please refresh the page.');
      return;
    }
    setLoading(true);
    try {
      const response = await researchApi.startResearch(
        formData.topic,
        user._id,
        formData.constraints
      );
      navigate(`/research/${response.session_id}`);
    } catch (error) {
      console.error('Failed to start research:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to start research';
      alert(`Failed to start research: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <Brain className="w-8 h-8 text-primary-600" /> */}
              <h1 className="text-xl font-bold text-gray-900">InsightEngine</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New Research Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowResearchForm(!showResearchForm)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Research
          </button>
        </div>

        {/* Research Form */}
        {showResearchForm && (
          <div className="mb-8">
            <ResearchForm onSubmit={handleStartResearch} loading={loading} />
          </div>
        )}

        {/* Research History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold">Your Research Sessions</h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No research sessions yet</p>
              
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const sessionId = session.id || session._id;
                return (
                  <div
                    key={sessionId}
                    onClick={() => sessionId && navigate(`/research/${sessionId}`)}
                    className={`w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer ${!sessionId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ cursor: sessionId ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {session.topic || 'Unknown Topic'}
                      </h3>
                      <StatusBadge status={session.status || 'pending'} />
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span>{formatDate(session.created_at)}</span>
                      {session.sections && session.sections.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {session.sections.length} sections
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
