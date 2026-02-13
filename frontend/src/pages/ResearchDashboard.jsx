import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Activity, Brain, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { researchApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import AgentActivityCard from '../components/AgentActivityCard';
import StatusBadge from '../components/StatusBadge';
import PlanApprovalDialog from '../components/PlanApprovalDialog';
import DownloadModal from '../components/DownloadModal';
import { getAgentColor, getAgentIcon } from '../utils/helpers';

const ResearchDashboard = () => {
  const params = useParams();
  const navigate = useNavigate();
  const sessionId = params.sessionId;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [particles, setParticles] = useState([]);
  const previousStatusRef = useRef(null);
  const canvasRef = useRef(null);
  
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

  // Particle system initialization
  useEffect(() => {
    const particleArray = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1
    }));
    setParticles(particleArray);
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId;
    let particleNetwork = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.5
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particleNetwork.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();

        particleNetwork.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Skip if no valid sessionId
    if (!sessionId || sessionId === 'undefined') {
      navigate('/dashboard');
      return;
    }
    
    // Reset loading state
    setLoading(true);
    
    // Load session
    loadSession();
    
    // Poll for updates
    const interval = setInterval(loadSession, 5000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [sessionId, navigate]);

  const loadSession = async () => {
    try {
      const data = await researchApi.getSession(sessionId);
      if (data) {
        // Check if status changed to completed
        if (data.status === 'completed' && previousStatusRef.current !== 'completed') {
          setShowDownloadModal(true);
        }
        previousStatusRef.current = data.status;
        setSession(data);
      } else {
        console.error('Session not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Show modal when session is completed and PDF is ready
  useEffect(() => {
    if (session && session.status === 'completed' && previousStatusRef.current !== 'completed') {
      setShowDownloadModal(true);
      previousStatusRef.current = 'completed';
    }
  }, [session]);

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
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to reject plan:', error);
    }
  };

  const handleDownload = () => {
    window.open(researchApi.downloadReport(sessionId), '_blank');
  };

  const handleOpenReport = () => {
    // Use Cloudinary URL if available, otherwise use local download
    if (session?.cloudinary_url) {
      // Use Google Docs Viewer for Cloudinary PDFs
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(session.cloudinary_url)}&embedded=true`, '_blank');
    } else {
      const pdfUrl = `http://localhost:8000/api/research/download/${sessionId}`;
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

          * {
            font-family: 'Space Mono', monospace;
          }

          h1, h2, h3, .display-font {
            font-family: 'Syne', sans-serif;
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }

          .animate-spin-slow { animation: spin-slow 3s linear infinite; }

          .glass-effect {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
        `}</style>
        
        <div className="glass-effect rounded-2xl p-8 text-center shadow-2xl max-w-md animate-reveal">
          <p className="text-xl text-white mb-6 display-font">Session not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        * {
          font-family: 'Space Mono', monospace;
        }

        h1, h2, h3, .display-font {
          font-family: 'Syne', sans-serif;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.7); }
        }

        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-morph { animation: morph 8s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-reveal { animation: reveal 0.6s ease-out forwards; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }

        .glass-effect {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .glass-effect-light {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(59, 130, 246, 0.15);
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent);
          pointer-events: none;
        }

        .button-ripple {
          position: relative;
          overflow: hidden;
        }

        .button-ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .button-ripple:active::after {
          width: 300px;
          height: 300px;
        }

        .activity-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .activity-card:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Canvas for particle network */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.4 }}
      />

      {/* Animated morphing blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-full blur-[120px] animate-morph"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-pink-500/20 to-blue-500/25 rounded-full blur-[100px] animate-morph" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/15 to-blue-500/25 rounded-full blur-[80px] animate-morph" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: `${particle.id * 0.2}s`,
            animationDuration: `${6 + particle.id * 0.3}s`
          }}
        />
      ))}

      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 border-b border-blue-400/20 animate-reveal">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 glass-effect-light px-5 py-2.5 text-blue-200 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/dashboard')}
            >
              {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse-glow relative overflow-hidden"> */}
                {/* <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div> */}
                {/* <Brain className="w-7 h-7 text-white relative z-10" /> */}
              {/* </div> */}
              <span className="text-2xl font-bold text-white display-font tracking-tight">InsightEngine</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Session Header */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl mb-8 relative overflow-hidden animate-reveal">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect-light rounded-full mb-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="w-4 h-4 text-blue-400 relative z-10 animate-pulse" />
                <span className="text-sm font-medium text-blue-300 relative z-10">Research Session</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4 display-font">
                {session.topic}
              </h1>
              <div className="flex items-center gap-4">
                <StatusBadge status={session.status} />
                <div className="flex items-center gap-2 glass-effect-light px-4 py-2 rounded-full">
                  {/* <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse-ring' : 'bg-slate-400'}`}></div> */}
                  <span className="text-sm text-blue-200">{connected ? 'Live' : 'Reconnecting...'}</span>
                </div>
              </div>
            </div>
            
            {session.status === 'completed' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenReport}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 button-ripple relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <ExternalLink className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Open Report</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 button-ripple relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Download className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Download Report</span>
                </button>
              </div>
            )}
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-tr-full pointer-events-none"></div>
        </div>

        {/* Plan Approval */}
        {session.status === 'awaiting_approval' && session.plan && !session.plan_approved && (
          <div className="mb-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
            <PlanApprovalDialog
              plan={session.plan}
              onApprove={handleApprovePlan}
              onReject={handleRejectPlan}
            />
          </div>
        )}

        {/* Agent Activity Stream */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-reveal" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
                <Activity className={`w-5 h-5 ${connected ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <h2 className="text-2xl font-bold text-white display-font">Agent Activity Stream</h2>
            </div>
            <div className="flex items-center gap-2 glass-effect-light px-4 py-2 rounded-full">
              <Zap className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-slate-400'}`} />
              <span className="text-sm text-blue-200">{connected ? 'Live Updates' : 'Reconnecting...'}</span>
            </div>
          </div>
          
          {/* Agent Summary */}
          <div className="flex flex-wrap gap-3 mb-8 relative z-10">
            {['manager', 'researcher', 'writer', 'critique'].map((agent, index) => (
              <div
                key={agent}
                className="glass-effect-light px-5 py-3 rounded-xl border border-blue-400/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-xl">{getAgentIcon(agent)}</span>
                  <div>
                    <span className="font-semibold text-white capitalize block">{agent}</span>
                    <span className="text-sm text-blue-300">{agentSummary[agent]?.count || 0} actions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {allUpdates.length === 0 ? (
            <div className="text-center py-16 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float relative">
                <div className="absolute inset-0 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-spin-slow"></div>
              </div>
              <p className="text-blue-200 text-lg">Waiting for research to begin...</p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {allUpdates.map((update, idx) => (
                <div 
                  key={idx} 
                  className="activity-card"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <AgentActivityCard update={update} />
                </div>
              ))}
            </div>
          )}
          
          {session.status === 'completed' && (
            <div className="mt-8 glass-effect-light border border-green-400/30 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-green-400 font-bold mb-3 text-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    ✅
                  </div>
                  Research Complete
                </div>
                <p className="text-green-300">
                  Your research report has been generated. Click "Open Report" to view it online or "Download Report" to save a copy.
                </p>
              </div>
            </div>
          )}

          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-tr-full pointer-events-none"></div>
        </div>
      </main>

      {/* Footer indicators */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500/40 rounded-full animate-float"
            style={{ 
              animationDelay: `${i * 0.3}s`,
              opacity: 0.4 + i * 0.2
            }}
          ></div>
        ))}
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        sessionId={sessionId}
        sessionTopic={session?.topic || 'Research Report'}
        cloudinaryUrl={session?.cloudinary_url}
      />
    </div>
  );
};

export default ResearchDashboard;