import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Calendar,
  Loader,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Award,
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
import CurrencyIcon from '../../components/CurrencyIcon';
import { dashboardAPI, reservationAPI, commissionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { formatPrice } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingReservations: 0,
    totalCommissions: '0',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, reservationsRes, releasesRes] = await Promise.allSettled([
        dashboardAPI.getAgentStats(),
        reservationAPI.getAgentReservations(),
        commissionAPI.getMyReleases(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats || {});
      }
      if (reservationsRes.status === 'fulfilled') {
        setReservations(reservationsRes.value.data.reservations || []);
      }
      if (releasesRes.status === 'fulfilled') {
        setReleases(releasesRes.value.data.releases || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getReservationStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const approvedCount = reservations.filter((r) => r.status === 'approved').length;
  const completedCount = reservations.filter((r) => r.status === 'completed').length;

  const totalEarned = releases.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalPaid = releases
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalPending = releases
    .filter((r) => r.status === 'pending')
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  // Chart: last 6 months of reservations
  const chartData = (() => {
    const map = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      map[key] = { month: key, total: 0, completed: 0 };
    }
    reservations.forEach((r) => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (map[key]) {
        map[key].total += 1;
        if (r.status === 'completed') map[key].completed += 1;
      }
    });
    return Object.values(map);
  })();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar userRole="agent" />
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
      <Sidebar userRole="agent" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Dashboard</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">
                Welcome back, {user?.name || 'Agent'}! 👋
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
              <Clock size={18} /> {error}
              <button onClick={fetchDashboardData} className="ml-auto text-red-700 hover:text-red-900 underline">
                Try Again
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Link to="/agent/properties" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-green dark:bg-emerald-900 p-3 rounded-lg">
                  <Home className="text-soft-green" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">My Properties</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">
                    {stats.totalProperties}
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/agent/reservations" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-orange dark:bg-amber-900 p-3 rounded-lg">
                  <Clock className="text-warm-orange" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/agent/reservations" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                  <CheckCircle className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">
                    {completedCount}
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/agent/commissions" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition hover:border-soft-green">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-yellow dark:bg-yellow-900 p-3 rounded-lg flex items-center justify-center w-12 h-12">
                  <CurrencyIcon size={24} className="text-warm-orange" />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">
                    {formatPrice(totalEarned)}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Chart + Commission breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Reservations (Last 6 Months)
                </h2>
              </div>
              <div style={{ width: '100%', height: 260 }}>
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
                    <Bar dataKey="total" fill="#34d399" radius={[6, 6, 0, 0]} name="Total" />
                    <Bar dataKey="completed" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-soft-green" />
                <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                  Commission Breakdown
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-light-text dark:text-gray-400">Total Earned</span>
                  <span className="font-bold text-dark-text dark:text-white">
                    {formatPrice(totalEarned)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-light-text dark:text-gray-400">Paid</span>
                  <span className="font-bold text-emerald-600">
                    {formatPrice(totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-light-text dark:text-gray-400">Pending</span>
                  <span className="font-bold text-amber-600">
                    {formatPrice(totalPending)}
                  </span>
                </div>
                <Link
                  to="/agent/commissions"
                  className="block text-center text-xs text-soft-green hover:text-warm-orange font-medium pt-2"
                >
                  View Commissions →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Reservations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-dark-text dark:text-white">
                Recent Reservations
              </h2>
              <Link
                to="/agent/reservations"
                className="text-sm text-soft-green hover:text-warm-orange transition flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {reservations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-light-text dark:text-gray-400">No recent reservations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.slice(0, 5).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 border border-pastel-green dark:border-gray-700 rounded-lg hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition"
                  >
                    <div>
                      <p className="font-medium text-dark-text dark:text-white">
                        {reservation.property_title || 'Property'}
                      </p>
                      <p className="text-sm text-light-text dark:text-gray-400">
                        Client: {reservation.client_name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-light-text dark:text-gray-400">
                          {formatDate(reservation.reservation_date)}
                        </p>
                        <p className="text-xs text-light-text dark:text-gray-400">
                          {formatTime(reservation.reservation_time)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getReservationStatusBadge(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;