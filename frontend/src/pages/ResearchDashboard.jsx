import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Activity, Target, Search, Edit3, CheckCircle } from 'lucide-react';
import { researchApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import AgentActivityCard from '../components/AgentActivityCard';
import StatusBadge from '../components/StatusBadge';
import PlanApprovalDialog from '../components/PlanApprovalDialog';

const ResearchDashboard = () => {
  const params = useParams();
  const navigate = useNavigate();
  const sessionId = params.sessionId;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Only connect to WebSocket if we have a valid sessionId
  const { updates: liveUpdates, connected } = useWebSocket(sessionId && sessionId !== 'undefined' ? sessionId : null);

  // Combine live updates with historical updates from session
  const allUpdates = useMemo(() => {
    if (!session) return liveUpdates;
    const historicalUpdates = session.agent_updates || [];
    // Avoid duplicates by checking timestamps
    const historicalTimestamps = new Set(historicalUpdates.map(u => u.timestamp));
    const newLiveUpdates = liveUpdates.filter(u => !historicalTimestamps.has(u.timestamp));
    return [...historicalUpdates, ...newLiveUpdates];
  }, [session, liveUpdates]);

  // Group updates by agent for summary
  const agentSummary = useMemo(() => {
    const summary = {};
    allUpdates.forEach(update => {
      if (!summary[update.agent]) {
        summary[update.agent] = { count: 0, lastAction: null };
      }
      summary[update.agent].count += 1;
      summary[update.agent].lastAction = update.action;
    });
    return summary;
  }, [allUpdates]);

  useEffect(() => {
    // Redirect to home if no valid sessionId
    if (!sessionId || sessionId === 'undefined') {
      navigate('/');
      return;
    }
    loadSession();
    const interval = setInterval(loadSession, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await researchApi.getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    try {
      await researchApi.approvePlan(sessionId, true);
      await loadSession();
    } catch (error) {
      console.error('Failed to approve plan:', error);
    }
  };

  const handleRejectPlan = async () => {
    try {
      await researchApi.approvePlan(sessionId, false);
      alert('Plan rejected. You can start a new research session.');
      navigate('/');
    } catch (error) {
      console.error('Failed to reject plan:', error);
    }
  };

  const handleDownload = () => {
    window.open(researchApi.downloadReport(sessionId), '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading research session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Session not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {session.topic}
                </h1>
                <div className="flex items-center gap-4">
                  <StatusBadge status={session.status} />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className={`w-4 h-4 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
                    {connected ? 'Live' : 'Disconnected'}
                  </div>
                </div>
              </div>
              
              {session.status === 'completed' && (
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Plan Approval */}
        {session.status === 'awaiting_approval' && session.plan && !session.plan_approved && (
          <div className="mb-6">
            <PlanApprovalDialog
              plan={session.plan}
              onApprove={handleApprovePlan}
              onReject={handleRejectPlan}
            />
          </div>
        )}

        {/* Agent Activity Stream */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Agent Activity Stream</h2>
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Live' : 'Reconnecting...'}
              </span>
            </div>
          </div>
          
          {/* Agent Summary */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full text-sm">
              <span>🎯</span>
              <span className="font-medium">Manager:</span>
              <span>{agentSummary.manager?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-sm">
              <span>🔍</span>
              <span className="font-medium">Researcher:</span>
              <span>{agentSummary.researcher?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-sm">
              <span>✍️</span>
              <span className="font-medium">Writer:</span>
              <span>{agentSummary.writer?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full text-sm">
              <span>🔎</span>
              <span className="font-medium">Critique:</span>
              <span>{agentSummary.critique?.count || 0}</span>
            </div>
          </div>
          
          {allUpdates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Waiting for research to begin...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allUpdates.map((update, idx) => (
                <AgentActivityCard key={idx} update={update} />
              ))}
            </div>
          )}
          
          {session.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                ✅ Research Complete
              </div>
              <p className="text-green-700">
                Your research report has been generated. Click the download button above to access it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
