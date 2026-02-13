import React, { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';

const ResearchForm = ({ onSubmit, loading }) => {
  const [topic, setTopic] = useState('');
  const [constraints, setConstraints] = useState('');

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
    <div className="card max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-primary-600" />
        <h2 className="text-2xl font-bold">Start New Research</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Topic *
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a complex research topic you'd like to explore..."
            className="input-field h-32 resize-none"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Constraints (Optional)
          </label>
          <input
            type="text"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g., Focus on last 5 years, exclude specific sources..."
            className="input-field"
            disabled={loading}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Example Topics:</p>
          <div className="space-y-2">
            {exampleTopics.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadExample(example)}
                className="text-sm text-primary-600 hover:text-primary-700 block text-left hover:underline"
                disabled={loading}
              >
                • {example}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting Research...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Start Research
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ResearchForm;
