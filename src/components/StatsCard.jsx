import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color, change, changeType = 'increase' }) => {
  const bgColors = {
    'bg-blue-500': 'bg-blue-500',
    'bg-green-500': 'bg-green-500',
    'bg-purple-500': 'bg-purple-500',
    'bg-yellow-500': 'bg-yellow-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        {change && (
          <div className={`flex items-center text-sm font-semibold ${
            changeType === 'increase' ? 'text-green-500' : 'text-red-500'
          }`}>
            {changeType === 'increase' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default StatsCard;