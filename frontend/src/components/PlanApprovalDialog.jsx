import React, { useState } from 'react';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react';

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
    <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            ⏸️ Human Approval Required
          </h3>
          <p className="text-slate-500 text-sm">
            The AI has created a research plan. Please review and approve to continue.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-slate-800 mb-3">Planned Research Sections:</h4>
        <div className="space-y-2">
          {plan.sections?.map((section, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-amber-500 font-medium min-w-[24px]">{idx + 1}.</span>
              <span className="text-slate-700">{section}</span>
            </div>
          ))}
        </div>

        {plan.estimated_sources && (
          <div className="mt-4 text-sm text-slate-500">
            <span className="font-medium text-slate-600">Estimated sources:</span> {plan.estimated_sources}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Approve & Continue
            </>
          )}
        </button>
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-300 disabled:opacity-50"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </button>
      </div>
    </div>
  );
};

export default PlanApprovalDialog;
