import React, { useEffect } from 'react';
import { Download, X, FileText, CheckCircle, ExternalLink } from 'lucide-react';

const DownloadModal = ({ isOpen, onClose, sessionId, sessionTopic, cloudinaryUrl }) => {
  useEffect(() => {
    // Close modal on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const handleOpenReport = () => {
    if (cloudinaryUrl) {
      // Use Google Docs Viewer for Cloudinary PDFs
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(cloudinaryUrl)}&embedded=true`, '_blank');
    } else {
      // Fallback to local download if no cloudinary URL
      window.open(`http://localhost:8000/api/research/download/${sessionId}`, '_blank');
    }
    onClose();
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:8000/api/research/download/${sessionId}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modal-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Your PDF is Ready!
          </h2>

          {/* Description */}
          <p className="text-slate-500 mb-2">
            Your research report for
          </p>
          <p className="text-slate-800 font-medium mb-6">
            "{sessionTopic}"
          </p>

          {/* Open Report Button */}
          {cloudinaryUrl && (
            <button
              onClick={handleOpenReport}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center gap-2 mb-3"
            >
              <ExternalLink className="w-5 h-5" />
              Open Report Online
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Download PDF
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="mt-3 w-full py-3 bg-slate-100 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all duration-300"
          >
            Maybe Later
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modalIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DownloadModal;
