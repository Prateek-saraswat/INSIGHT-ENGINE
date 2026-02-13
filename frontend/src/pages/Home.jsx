import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, FileText } from 'lucide-react';
import ResearchForm from '../components/ResearchForm';
import StatusBadge from '../components/StatusBadge';
import { researchApi } from '../services/api';
import { formatDate } from '../utils/helpers';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const userId = 'user-001'; // In production, get from auth

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await researchApi.getUserSessions(userId);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleStartResearch = async (formData) => {
    setLoading(true);
    try {
      const response = await researchApi.startResearch(
        formData.topic,
        userId,
        formData.constraints
      );
      navigate(`/research/${response.session_id}`);
    } catch (error) {
      console.error('Failed to start research:', error);
      alert('Failed to start research. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">InsightEngine</h1>
          </div>
          <p className="text-xl text-gray-600">
            Autonomous Research Platform powered by Multi-Agent AI
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time Transparency
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Self-Correction
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Human-in-the-Loop
            </div>
          </div>
        </div>

        {/* Research Form */}
        <div className="mb-12">
          <ResearchForm onSubmit={handleStartResearch} loading={loading} />
        </div>

        {/* Research History */}
        {sessions.length > 0 && (
          <div className="card max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold">Recent Research Sessions</h2>
            </div>
            
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/research/${session.id}`)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">
                      {session.topic}
                    </h3>
                    <StatusBadge status={session.status} />
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-lg mb-2">Strategic Planning</h3>
            <p className="text-gray-600 text-sm">
              Manager agent breaks down complex topics into structured research sections
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-bold text-lg mb-2">Web Research</h3>
            <p className="text-gray-600 text-sm">
              Researcher agent gathers real-time data from authoritative sources
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-bold text-lg mb-2">Content Synthesis</h3>
            <p className="text-gray-600 text-sm">
              Writer agent creates coherent, professional research reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
