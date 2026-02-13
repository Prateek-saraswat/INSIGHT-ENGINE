import React from 'react';
import { getAgentColor, getAgentIcon, formatDate } from '../utils/helpers';

const AgentActivityCard = ({ update }) => {
  const { agent, action, details, timestamp } = update;
  
  return (
    <div className="p-4 bg-white border border-blue-100 rounded-xl hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getAgentColor(agent)}`}>
          {getAgentIcon(agent)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-slate-800 capitalize">{agent}</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500 capitalize">{action.replace(/_/g, ' ')}</span>
          </div>
          
          {details.message && (
            <p className="text-slate-700 mb-3">{details.message}</p>
          )}
          
          {/* Section Info */}
          {details.section && (
            <div className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-600">Section:</span> {details.section}
            </div>
          )}
          
          {/* Sources Info */}
          {details.num_sources !== undefined && (
            <div className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-600">Sources found:</span> {details.num_sources}
            </div>
          )}
          
          {/* Word Count */}
          {details.word_count !== undefined && (
            <div className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-600">Word count:</span> {details.word_count}
            </div>
          )}
          
          {/* Quality Score */}
          {details.quality_score !== undefined && (
            <div className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-600">Quality score:</span> {details.quality_score}/10
            </div>
          )}
          
          {/* Feedback */}
          {details.feedback && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <span className="font-medium text-amber-700">Feedback:</span> {details.feedback}
            </div>
          )}
          
          {/* Preview */}
          {details.preview && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg italic text-slate-600">
              "{details.preview}"
            </div>
          )}
          
          {/* Plan */}
          {details.plan && (
            <div className="mt-3 space-y-2">
              <div className="font-medium text-sm text-slate-600">Research Plan:</div>
              <div className="space-y-1">
                {details.plan.sections?.map((section, idx) => (
                  <div key={idx} className="text-sm text-slate-500 pl-3 border-l-2 border-blue-200">
                    {idx + 1}. {section}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sources List */}
          {details.sources && details.sources.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="font-medium text-sm text-slate-600">Sources:</div>
              {details.sources.map((source, idx) => (
                <div key={idx} className="text-xs text-slate-400 pl-3 truncate">
                  • <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    {source.title}
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {/* Revision Info */}
          {details.revision_count !== undefined && (
            <div className="text-sm text-slate-500 mb-1">
              <span className="font-medium text-slate-600">Revision:</span> {details.revision_count}
            </div>
          )}
          
          {/* Revision Approved */}
          {details.has_issues === false && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ Section approved
            </div>
          )}
          
          <div className="text-xs text-slate-400 mt-3">
            {formatDate(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentActivityCard;
