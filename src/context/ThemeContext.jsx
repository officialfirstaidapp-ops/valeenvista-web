import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'PHP';
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Save currency
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

 // Format price based on selected currency
const formatPrice = (price) => {
  // Handle null/undefined
  if (price === null || price === undefined || price === '') {
    return currency === 'PHP' ? '₱0' : '$0';
  }

  // If it's a string, strip any non-numeric characters (except . and -)
  let numPrice;
  if (typeof price === 'string') {
    // Remove ₱, $, commas, spaces
    const cleaned = price.replace(/[₱$,₱\s]/g, '').trim();
    numPrice = parseFloat(cleaned);
  } else {
    numPrice = parseFloat(price);
  }

  // If parsing failed, return 0
  if (isNaN(numPrice)) {
    return currency === 'PHP' ? '₱0' : '$0';
  }

  if (currency === 'PHP') {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  } else {
    // Convert PHP to USD (approximate rate: 1 USD = 56 PHP)
    const usdPrice = numPrice / 56;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usdPrice);
  }
};

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === 'PHP' ? '₱' : '$';
  };

  const value = {
    darkMode,
    toggleDarkMode,
    currency,
    setCurrency,
    formatPrice,
    getCurrencySymbol,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;