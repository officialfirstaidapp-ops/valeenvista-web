import React, { useState, useEffect } from 'react';
import { Moon, Sun, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../context/ThemeContext';

const ClientSettings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setSuccessMessage(`Theme switched to ${darkMode ? 'Dark' : 'Light'} mode`);
    const t = setTimeout(() => setSuccessMessage(''), 2000);
    return () => clearTimeout(t);
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="client" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text dark:text-white">Settings</h1>
            <p className="text-light-text dark:text-gray-400 mt-1">
              Manage your preferences
            </p>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                {darkMode ? (
                  <Moon size={20} className="text-soft-green" />
                ) : (
                  <Sun size={20} className="text-warm-orange" />
                )}
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Appearance
                </h2>
              </div>
              <p className="text-sm text-light-text dark:text-gray-400 mb-4">
                Switch between light and dark theme
              </p>

              <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-dark-text dark:text-white">
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-sm text-light-text dark:text-gray-400">
                    {darkMode
                      ? 'Currently using dark theme'
                      : 'Currently using light theme'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientSettings;