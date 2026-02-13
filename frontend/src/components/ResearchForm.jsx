import React, { useState } from 'react';
import { FileText, Sparkles, Lightbulb } from 'lucide-react';

const ResearchForm = ({ onSubmit, loading }) => {
  const [topic, setTopic] = useState('');
  const [constraints, setConstraints] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const exampleTopics = [
    'Impact of artificial intelligence on healthcare diagnostics',
    'Climate change effects on global agriculture',
    'The future of quantum computing in cryptography',
    'Social media influence on mental health in teenagers',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit({
        topic: topic.trim(),
        constraints: constraints.trim() || null,
      });
    }
  };

  const loadExample = (example) => {
    setTopic(example);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Research Topic */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Research Topic *
        </label>
        <div className="relative">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onFocus={() => setFocusedField('topic')}
            onBlur={() => setFocusedField('')}
            placeholder="Enter a complex research topic you'd like to explore..."
            className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300 h-32 resize-none"
            required
            disabled={loading}
          />
        </div>
      </div>

     

      {/* Example Topics */}
      <div className="p-4 bg-white border border-blue-100 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-medium text-slate-600">Example Topics:</p>
        </div>
        <div className="space-y-2">
          {exampleTopics.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadExample(example)}
              className="text-sm text-slate-500 hover:text-blue-600 block text-left transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              • {example}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Starting Research...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Start Research
            </>
          )}
        </span>
      </button>
    </form>
  );
};

export default ResearchForm;
