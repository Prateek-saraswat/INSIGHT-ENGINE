import React from 'react';
import { getStatusColor } from '../utils/helpers';

const StatusBadge = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;
