import React from 'react';

const PesoIcon = ({ size = 18, className = '' }) => {
  return (
    <span
      className={`font-bold flex items-center justify-center ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    >
      ₱
    </span>
  );
};

export default PesoIcon;