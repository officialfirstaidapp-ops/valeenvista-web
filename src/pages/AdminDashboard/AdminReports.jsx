import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, Home, Loader, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { reportAPI } from '../../services/api';

const AdminReports = () => {
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState('month');
  const [format, setFormat] = useState('pdf');
  const [statusFilter, setStatusFilter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setGenerating(true);
    setSuccess('');
    setError('');

    try {
      let response;

      switch (reportType) {
        case 'users':
          response = await reportAPI.downloadUsers(format, dateRange);
          break;
        case 'properties':
          response = await reportAPI.downloadProperties(format, dateRange);
          break;
        case 'reservations':
          response = await reportAPI.downloadReservations(format, dateRange, statusFilter);
          break;
        case 'commissions':
          response = await reportAPI.downloadCommissions(format, dateRange);
          break;
        default:
          throw new Error('Unknown report type');
      }

      const blob = new Blob([response.data], {
        type: format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    { id: 'users', label: 'Users Report', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { id: 'properties', label: 'Properties Report', icon: Home, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
    { id: 'reservations', label: 'Reservations Report', icon: Calendar, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' },
    { id: 'commissions', label: 'Commissions Report', icon: PesoIcon, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' },
  ];

  const dateRanges = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text dark:text-white">Reports</h1>
            <p className="text-light-text dark:text-gray-400 mt-1">
              Generate and export system reports as PDF or Excel
            </p>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
                <h2 className="text-xl font-semibold text-dark-text dark:text-white mb-4">Report Options</h2>

                <div className="mb-6">
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-3">Report Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setReportType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          reportType === type.id
                            ? 'border-soft-green bg-pastel-green/20 dark:bg-emerald-900/20'
                            : 'border-pastel-green dark:border-gray-700 hover:border-soft-green'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mx-auto mb-2`}>
                          {typeof type.icon === 'string' || type.id !== 'commissions' ? (
                            <type.icon size={24} />
                          ) : (
                            <type.icon size={24} />
                          )}
                        </div>
                        <p className="text-sm text-dark-text dark:text-white text-center">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-3">Date Range</label>
                  <div className="flex flex-wrap gap-2">
                    {dateRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setDateRange(range.value)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          dateRange === range.value
                            ? 'bg-soft-green text-white border-soft-green'
                            : 'border-pastel-green dark:border-gray-700 text-dark-text dark:text-white hover:border-soft-green'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {reportType === 'reservations' && (
                  <div className="mb-6">
                    <label className="block text-dark-text dark:text-white text-sm font-bold mb-3">
                      Reservation Status (optional)
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full md:w-64 px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-3">Export Format</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormat('pdf')}
                      className={`px-6 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                        format === 'pdf'
                          ? 'bg-soft-green text-white border-soft-green'
                          : 'border-pastel-green dark:border-gray-700 text-dark-text dark:text-white hover:border-soft-green'
                      }`}
                    >
                      <FileText size={18} />
                      PDF
                    </button>
                    <button
                      onClick={() => setFormat('excel')}
                      className={`px-6 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                        format === 'excel'
                          ? 'bg-soft-green text-white border-soft-green'
                          : 'border-pastel-green dark:border-gray-700 text-dark-text dark:text-white hover:border-soft-green'
                      }`}
                    >
                      <Download size={18} />
                      Excel
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="w-full bg-soft-green text-white py-3 rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {generating ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
                  {generating ? 'Generating report...' : `Download ${format === 'pdf' ? 'PDF' : 'Excel'}`}
                </button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
                <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-4">About Reports</h3>
                <div className="space-y-3 text-sm text-light-text dark:text-gray-400">
                  <p>• <strong className="text-dark-text dark:text-white">Users Report:</strong> All users by role with contact info</p>
                  <p>• <strong className="text-dark-text dark:text-white">Properties Report:</strong> Property listings with prices and status</p>
                  <p>• <strong className="text-dark-text dark:text-white">Reservations Report:</strong> Client viewings with statuses</p>
                  <p>• <strong className="text-dark-text dark:text-white">Commissions Report:</strong> Agent earnings breakdown</p>
                  <hr className="border-pastel-green dark:border-gray-700" />
                  <p>• PDF: formatted tables, great for printing</p>
                  <p>• Excel: sortable columns, great for analysis</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;