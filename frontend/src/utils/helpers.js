export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getAgentColor = (agent) => {
  const colors = {
    manager: 'text-blue-600 bg-blue-50 border-blue-200',
    researcher: 'text-blue-600 bg-blue-50 border-blue-200',
    writer: 'text-blue-600 bg-blue-50 border-blue-200',
    critique: 'text-blue-600 bg-blue-50 border-blue-200',
  };
  return colors[agent] || 'text-slate-600 bg-slate-50 border-slate-200';
};

export const getAgentIcon = (agent) => {
  const icons = {
    manager: '🔷',
    researcher: '🔶',
    writer: '🟢',
    critique: '🔴',
  };
  return icons[agent] || '';
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    planning: 'bg-blue-50 text-blue-700 border-blue-200',
    awaiting_approval: 'bg-amber-50 text-amber-700 border-amber-200',
    researching: 'bg-blue-50 text-blue-700 border-blue-200',
    writing: 'bg-green-50 text-green-700 border-green-200',
    reviewing: 'bg-orange-50 text-orange-700 border-orange-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export const truncate = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
