import React from 'react';
import { useTheme } from '../context/ThemeContext';

const CurrencyIcon = ({ size = 20, className = '' }) => {
  const { currency } = useTheme();
  
  return (
    <span 
      className={`font-bold flex items-center justify-center ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    >
      {currency === 'PHP' ? '₱' : '$'}
    </span>
  );
};

export default CurrencyIcon;