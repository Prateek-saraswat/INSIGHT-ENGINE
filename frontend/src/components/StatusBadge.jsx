import React from 'react';
import { getStatusColor } from '../utils/helpers';

const StatusBadge = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;
