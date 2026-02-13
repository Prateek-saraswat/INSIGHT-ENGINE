import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, FileText, LogOut, Plus, Search, Trash2, Sparkles, Zap, TrendingUp } from 'lucide-react';
import ResearchForm from '../components/ResearchForm';
import StatusBadge from '../components/StatusBadge';
import { researchApi } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showResearchForm, setShowResearchForm] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Particle system initialization
  useEffect(() => {
    const particleArray = Array.from({ length: 30 }, (_, i) => ({
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
    let particleNetwork = Array.from({ length: 50 }, () => ({
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
    if (user?._id) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user?._id) return;
    try {
      const data = await researchApi.getUserSessions(user._id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleStartResearch = async (formData) => {
    if (!user?._id) {
      alert('User not loaded. Please refresh.');
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
      alert('Failed to start research. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this research session?')) {
      return;
    }
    setDeletingId(sessionId);
    try {
      await researchApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => (s.id || s._id) !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
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

        .text-gradient-animated {
          background: linear-gradient(120deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s linear infinite;
        }

        .session-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .session-card:hover {
          transform: translateY(-4px);
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
            <div className="flex items-center gap-4">
              <div className="glass-effect-light px-5 py-2.5 rounded-xl">
                <span className="text-blue-200">Welcome, </span>
                <span className="text-white font-semibold">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 glass-effect-light px-5 py-2.5 text-blue-200 rounded-xl hover:bg-white/10 transition-all duration-300 group"
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
          <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-300 text-sm mb-1">Total Research</p>
                <p className="text-3xl font-bold text-white display-font">{sessions.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-300 text-sm mb-1">Active Sessions</p>
                <p className="text-3xl font-bold text-white display-font">
                  {sessions.filter(s => s.status === 'in_progress' || s.status === 'pending').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-300 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-white display-font">
                  {sessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500/30 to-blue-500/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        

        {/* Research Form */}
        {showResearchForm && (
          <div className="mb-8 animate-reveal" style={{ animationDelay: '0.3s' }}>
            <div className="glass-effect rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white display-font">Start New Research</h2>
              </div>
              <div className="relative z-10">
                <ResearchForm onSubmit={handleStartResearch} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* Research History */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-reveal" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white display-font">Recent Research Sessions</h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-16 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                <Search className="w-12 h-12 text-blue-400" />
              </div>
              <p className="text-blue-200 text-lg mb-6">No research sessions yet</p>
              <button
                onClick={() => setShowResearchForm(true)}
                className="px-6 py-3 glass-effect-light border border-blue-400/30 text-blue-300 rounded-xl hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-2 group"
              >
                Start your first research
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {sessions.map((session, index) => {
                const sessionId = session.id || session._id;
                const isDeleting = deletingId === sessionId;
                return (
                  <div
                    key={sessionId || Math.random()}
                    onClick={() => sessionId && !isDeleting && navigate(`/research/${sessionId}`)}
                    className={`glass-effect-light rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer session-card relative overflow-hidden group ${!sessionId || isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ 
                      cursor: sessionId && !isDeleting ? 'pointer' : 'not-allowed',
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg mb-3 group-hover:text-blue-300 transition-colors display-font">
                          {session.topic || 'Unknown Topic'}
                        </h3>
                        <div className="text-sm text-blue-300 flex items-center gap-6">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(session.created_at)}
                          </span>
                          {session.sections && session.sections.length > 0 && (
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {session.sections.length} sections
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={session.status || 'pending'} />
                        <button
                          onClick={(e) => handleDeleteSession(e, sessionId)}
                          disabled={isDeleting}
                          className="p-2.5 glass-effect-light text-blue-300 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                          title="Delete session"
                        >
                          {isDeleting ? (
                            <div className="w-5 h-5 border-2 border-red-400 border-t-red-200 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                );
              })}
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
    </div>
  );
};

export default Home;