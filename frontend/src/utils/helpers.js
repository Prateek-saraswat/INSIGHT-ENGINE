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
    manager: 'text-purple-600 bg-purple-100',
    researcher: 'text-blue-600 bg-blue-100',
    writer: 'text-green-600 bg-green-100',
    critique: 'text-orange-600 bg-orange-100',
  };
  return colors[agent] || 'text-gray-600 bg-gray-100';
};

export const getAgentIcon = (agent) => {
  const icons = {
    manager: '🎯',
    researcher: '🔍',
    writer: '✍️',
    critique: '🔎',
  };
  return icons[agent] || '🤖';
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    planning: 'bg-blue-100 text-blue-800',
    awaiting_approval: 'bg-yellow-100 text-yellow-800',
    researching: 'bg-purple-100 text-purple-800',
    writing: 'bg-green-100 text-green-800',
    reviewing: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const truncate = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
