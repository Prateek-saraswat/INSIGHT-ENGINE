import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const PlanApprovalDialog = ({ plan, onApprove, onReject }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove();
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await onReject();
    setIsSubmitting(false);
  };

  if (!plan) return null;

  return (
    <div className="card border-2 border-yellow-400 bg-yellow-50">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ⏸️ Human Approval Required
        </h3>
        <p className="text-gray-700">
          The AI has created a research plan. Please review and approve to continue.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-3">Planned Research Sections:</h4>
        <div className="space-y-2">
          {plan.sections?.map((section, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-primary-600 font-medium">{idx + 1}.</span>
              <span className="text-gray-700">{section}</span>
            </div>
          ))}
        </div>

        {plan.estimated_sources && (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">Estimated sources:</span> {plan.estimated_sources}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Approve & Continue
        </button>
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </button>
      </div>
    </div>
  );
};

export default PlanApprovalDialog;
