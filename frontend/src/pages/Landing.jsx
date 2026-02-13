import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, Sparkles, MousePointer2, Zap, Target, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const heroRef = useRef(null);
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
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2
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
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particleNetwork.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fill();

        // Draw connections
        particleNetwork.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`;
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
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

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

  if (isAuthenticated) return null;

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
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
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

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes reveal-text {
          from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-morph { animation: morph 8s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-reveal { animation: reveal-text 1s ease-out forwards; }

        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .text-gradient {
          background: linear-gradient(120deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s linear infinite;
        }

        .hover-lift {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
        }

        .magnetic-button {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card {
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }

        .feature-card:hover {
          transform: translateY(-12px) rotateX(5deg);
        }

        .scan-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent);
          animation: scan-line 4s linear infinite;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.8), transparent);
          pointer-events: none;
        }

        .cursor-trail {
          position: fixed;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          pointer-events: none;
          transition: transform 0.15s ease-out;
          z-index: 9999;
        }

        .text-stroke {
          -webkit-text-stroke: 2px rgba(59, 130, 246, 0.3);
          text-stroke: 2px rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none; }
        }
      `}</style>

      {/* Canvas for particle network */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ opacity: 0.4 }}
      />

      {/* Animated morphing blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-[120px] animate-morph"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-pink-500/20 to-blue-500/30 rounded-full blur-[100px] animate-morph" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/20 to-blue-500/30 rounded-full blur-[80px] animate-morph" style={{ animationDelay: '4s' }}></div>
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

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 glass-effect">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 group cursor-pointer hover-lift"
            onClick={() => navigate('/')}
          >
            {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse-glow relative overflow-hidden"> */}
              {/* <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div> */}
              {/* <Brain className="w-7 h-7 text-white relative z-10" /> */}
            {/* </div> */}
            <span className="text-xl font-bold text-white display-font tracking-tight">InsightEngine</span>
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-2.5 glass-effect text-white font-semibold rounded-xl border border-blue-400/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover-lift"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge with shimmer effect */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-effect rounded-full mb-8 shadow-lg relative overflow-hidden group animate-reveal">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer"></div>
            <Sparkles className="w-4 h-4 text-blue-400 relative z-10" />
            <span className="text-sm font-medium text-blue-300 relative z-10">Autonomous Research Platform</span>
          </div>

          {/* Headline with glitch effect on hover */}
          <div className="relative group">
            <h1 className="text-7xl md:text-9xl font-bold mb-6 display-font animate-reveal" style={{ animationDelay: '0.2s' }}>
              <span className="text-gradient block mb-2">
                Research
              </span>
              <span className="text-white block text-stroke">
                Reimagined
              </span>
            </h1>
          </div>

          {/* Subheadline with staggered reveal */}
          <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-12 animate-reveal leading-relaxed" style={{ animationDelay: '0.4s' }}>
            Experience the power of multi-agent AI that plans, researches, writes, and self-corrects — all in real-time.
          </p>

          {/* CTA Button with magnetic effect */}
          <button
            onClick={() => navigate('/signin')}
            className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-500 magnetic-button overflow-hidden animate-reveal"
            style={{ animationDelay: '0.6s' }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0) scale(1)';
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative flex items-center gap-3 justify-center">
              Get Started
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>

          {/* Features Grid with 3D tilt effect */}
          <div className="grid md:grid-cols-3 gap-8 mt-28">
            {[
              { 
                icon: Target, 
                title: 'Strategic Planning', 
                desc: 'Manager agent breaks down complex topics into structured research sections',
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                icon: Zap, 
                title: 'Web Research', 
                desc: 'Researcher agent gathers real-time data from authoritative sources',
                color: 'from-purple-500 to-pink-500'
              },
              { 
                icon: BookOpen, 
                title: 'Content Synthesis', 
                desc: 'Writer agent creates coherent, professional research reports',
                color: 'from-pink-500 to-rose-500'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="feature-card p-8 glass-effect rounded-3xl shadow-2xl relative overflow-hidden group animate-reveal scan-effect"
                  style={{ animationDelay: `${0.8 + index * 0.2}s` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon container with pulse effect */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse-glow relative z-10`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 display-font relative z-10">{feature.title}</h3>
                  <p className="text-blue-200 leading-relaxed relative z-10">{feature.desc}</p>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators with animated dots */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-300 animate-reveal" style={{ animationDelay: '1.4s' }}>
            {[
              { label: 'Real-time Transparency', color: 'bg-blue-400' },
              { label: 'Self-Correction', color: 'bg-purple-500' },
              { label: 'Human-in-the-Loop', color: 'bg-pink-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 group cursor-default">
                <div className={`w-3 h-3 ${item.color} rounded-full animate-pulse group-hover:scale-150 transition-transform duration-300`}></div>
                <span className="group-hover:text-white transition-colors duration-300">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Additional visual elements */}
          <div className="mt-16 flex justify-center gap-4 hide-mobile animate-reveal" style={{ animationDelay: '1.6s' }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-float"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6 - i * 0.1 
                }}
              ></div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Landing;