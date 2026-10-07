import React, { useState, useEffect } from 'react';
import {
  Download,
  Loader,
  RefreshCw,
  Calendar,
  Users,
  Home,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  XCircle,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { dashboardAPI, reportAPI } from '../../services/api';

const BrokerReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('all');
  const [downloading, setDownloading] = useState(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalAgents: 0,
    totalReservations: 0,
    totalCommissions: '₱0',
    pendingReservations: 0,
    completedReservations: 0,
  });

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsResponse = await dashboardAPI.getBrokerStats();
      setStats(statsResponse.data.stats || {});
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    `₱${parseFloat(price || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  // ✅ Downloader
  const handleDownload = async (type, format) => {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      let res;
      if (type === 'properties') {
        res = await reportAPI.downloadProperties(format, range);
      } else if (type === 'reservations') {
        res = await reportAPI.downloadReservations(format, range);
      } else if (type === 'commissions') {
        res = await reportAPI.downloadCommissions(format, range);
      }

      // Create blob + trigger download
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      a.download = `${type}-report-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Download ${type} ${format} error:`, err);
      alert(`Failed to download ${type} report. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar userRole="broker" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-soft-green" size={48} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="broker" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Reports</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">
                View business analytics and download reports for your team
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="px-3 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-800 text-dark-text dark:text-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={fetchReportsData}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700"
              >
                <RefreshCw size={18} /> Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
              <button onClick={fetchReportsData} className="ml-auto text-red-700 hover:text-red-900 underline">
                Try Again
              </button>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-pastel-green dark:bg-emerald-900 p-2 rounded-lg">
                  <Home size={20} className="text-soft-green" />
                </div>
                <div>
                  <p className="text-xs text-light-text dark:text-gray-400">Total Properties</p>
                  <p className="text-xl font-bold text-dark-text dark:text-white">
                    {stats.totalProperties}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-pastel-orange dark:bg-amber-900 p-2 rounded-lg">
                  <Users size={20} className="text-warm-orange" />
                </div>
                <div>
                  <p className="text-xs text-light-text dark:text-gray-400">Total Agents</p>
                  <p className="text-xl font-bold text-dark-text dark:text-white">
                    {stats.totalAgents}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-pastel-yellow dark:bg-yellow-900 p-2 rounded-lg">
                  <DollarSign size={20} className="text-warm-orange" />
                </div>
                <div>
                  <p className="text-xs text-light-text dark:text-gray-400">Total Commissions</p>
                  <p className="text-xl font-bold text-dark-text dark:text-white">
                    {formatPrice(stats.totalCommissions)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Calendar size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-light-text dark:text-gray-400">Reservations</p>
                  <p className="text-xl font-bold text-dark-text dark:text-white">
                    {stats.totalReservations}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Reservations Overview
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-light-text dark:text-gray-400">Pending</span>
                  <span className="font-medium text-yellow-600">
                    {stats.pendingReservations || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-light-text dark:text-gray-400">Completed</span>
                  <span className="font-medium text-green-600">
                    {stats.completedReservations || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-light-text dark:text-gray-400">Total</span>
                  <span className="font-medium text-dark-text dark:text-white">
                    {stats.totalReservations || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <PieChart size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Download Reports
                </h2>
              </div>
              <p className="text-xs text-light-text dark:text-gray-400 mb-4">
                Reports are scoped to your team only. Range: <strong>{range}</strong>
              </p>

              <div className="space-y-3">
                {/* Properties */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-pastel-green dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Home size={18} className="text-soft-green" />
                    <span className="text-sm font-medium text-dark-text dark:text-white">
                      Properties Report
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('properties', 'pdf')}
                      disabled={downloading === 'properties-pdf'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'properties-pdf' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload('properties', 'excel')}
                      disabled={downloading === 'properties-excel'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'properties-excel' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Excel
                    </button>
                  </div>
                </div>

                {/* Reservations */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-pastel-green dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-soft-green" />
                    <span className="text-sm font-medium text-dark-text dark:text-white">
                      Reservations Report
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('reservations', 'pdf')}
                      disabled={downloading === 'reservations-pdf'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'reservations-pdf' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload('reservations', 'excel')}
                      disabled={downloading === 'reservations-excel'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'reservations-excel' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Excel
                    </button>
                  </div>
                </div>

                {/* Commissions */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-pastel-green dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-soft-green" />
                    <span className="text-sm font-medium text-dark-text dark:text-white">
                      Commissions Report
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('commissions', 'pdf')}
                      disabled={downloading === 'commissions-pdf'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'commissions-pdf' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload('commissions', 'excel')}
                      disabled={downloading === 'commissions-excel'}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === 'commissions-excel' ? (
                        <Loader className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrokerReports;