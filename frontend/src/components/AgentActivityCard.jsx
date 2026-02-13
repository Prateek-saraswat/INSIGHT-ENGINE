import React from 'react';
import { getAgentColor, getAgentIcon, formatDate } from '../utils/helpers';

const AgentActivityCard = ({ update }) => {
  const { agent, action, details, timestamp } = update;
  
  return (
    <div className={`border-l-4 ${getAgentColor(agent).split(' ')[1].replace('bg-', 'border-')} bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getAgentColor(agent)}`}>
          {getAgentIcon(agent)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold capitalize">{agent}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600 capitalize">{action.replace('_', ' ')}</span>
          </div>
          
          {details.message && (
            <p className="text-gray-700 mb-2">{details.message}</p>
          )}
          
          {/* Section Info */}
          {details.section && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Section:</span> {details.section}
            </div>
          )}
          
          {/* Sources Info */}
          {details.num_sources !== undefined && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Sources found:</span> {details.num_sources}
            </div>
          )}
          
          {/* Word Count */}
          {details.word_count !== undefined && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Word count:</span> {details.word_count}
            </div>
          )}
          
          {/* Quality Score */}
          {details.quality_score !== undefined && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Quality score:</span> {details.quality_score}/10
            </div>
          )}
          
          {/* Feedback */}
          {details.feedback && (
            <div className="mt-2 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
              <span className="font-medium">Feedback:</span> {details.feedback}
            </div>
          )}
          
          {/* Preview */}
          {details.preview && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 italic">
              "{details.preview}"
            </div>
          )}
          
          {/* Plan */}
          {details.plan && (
            <div className="mt-2 space-y-2">
              <div className="font-medium text-sm">Research Plan:</div>
              <div className="space-y-1">
                {details.plan.sections?.map((section, idx) => (
                  <div key={idx} className="text-sm text-gray-700 pl-3">
                    {idx + 1}. {section}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sources List */}
          {details.sources && details.sources.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="font-medium text-sm">Sources:</div>
              {details.sources.map((source, idx) => (
                <div key={idx} className="text-xs text-gray-600 pl-3 truncate">
                  • <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {source.title}
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {/* Revision Info */}
          {details.revision_count !== undefined && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Revision:</span> {details.revision_count}
            </div>
          )}
          
          {/* Revision Approved */}
          {details.has_issues === false && (
            <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
              ✅ Section approved
            </div>
          )}
          
          <div className="text-xs text-gray-400 mt-2">
            {formatDate(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentActivityCard;
