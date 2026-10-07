import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Loader,
  RefreshCw,
  XCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { dashboardAPI, reservationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BrokerDashboard = () => {
  const { user } = useAuth();
  const { formatPrice } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalAgents: 0,
    totalReservations: 0,
    totalCommissions: '0',
    pendingReservations: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Stats
      const statsRes = await dashboardAPI.getBrokerStats();
      setStats(statsRes.data.stats || {});

      // Recent reservations (last 5)
      try {
        const resRes = await reservationAPI.getAll({ limit: 5 });
        const rows = resRes.data.reservations || [];
        setRecentReservations(rows);

        // Build monthly chart from returned rows (fallback if < 5)
        buildChartData(rows);
      } catch (e) {
        console.error('Recent reservations failed:', e);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (rows) => {
    // Group reservations by month (last 6 months)
    const map = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      map[key] = { month: key, reservations: 0, completed: 0 };
    }
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (map[key]) {
        map[key].reservations += 1;
        if (r.status === 'completed') map[key].completed += 1;
      }
    });
    setChartData(Object.values(map));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:         return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Dashboard</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">
                Welcome back, {user?.name || 'Broker'}! 👋
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
              <button onClick={fetchDashboardData} className="ml-auto text-red-700 hover:text-red-900 underline">
                Try Again
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Link to="/broker/properties" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-green dark:bg-emerald-900 p-3 rounded-lg"><Building2 className="text-soft-green" size={24} /></div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Properties</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.totalProperties}</p>
                </div>
              </div>
            </Link>
            <Link to="/broker/agents" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-orange dark:bg-amber-900 p-3 rounded-lg"><Users className="text-warm-orange" size={24} /></div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Agents</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.totalAgents}</p>
                </div>
              </div>
            </Link>
            <Link to="/broker/reservations" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-yellow dark:bg-yellow-900 p-3 rounded-lg"><Calendar className="text-warm-orange" size={24} /></div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Reservations</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.totalReservations}</p>
                  {stats.pendingReservations > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">{stats.pendingReservations} pending</p>
                  )}
                </div>
              </div>
            </Link>
            <Link to="/broker/commissions" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg"><DollarSign className="text-blue-500" size={24} /></div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Commissions</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{formatPrice(stats.totalCommissions)}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Chart + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Reservations (Last 6 Months)
                </h2>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="reservations" fill="#34d399" radius={[6, 6, 0, 0]} name="Total" />
                    <Bar dataKey="completed" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Reservations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Recent Reservations
                </h2>
              </div>

              {recentReservations.length === 0 ? (
                <p className="text-sm text-light-text dark:text-gray-400 text-center py-8">
                  No reservations yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentReservations.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      to="/broker/reservations"
                      className="block p-3 rounded-lg hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition border border-pastel-green/50 dark:border-gray-700"
                    >
                      <p className="text-sm font-medium text-dark-text dark:text-white truncate">
                        {r.property_title || 'Property'}
                      </p>
                      <p className="text-xs text-light-text dark:text-gray-400 mt-0.5">
                        {r.client_name || 'Client'} · {formatDate(r.created_at)}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </Link>
                  ))}
                  <Link
                    to="/broker/reservations"
                    className="block text-center text-xs text-soft-green hover:text-warm-orange font-medium pt-2"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrokerDashboard;