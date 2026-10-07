import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Calendar, 
  FileText,
  TrendingUp,
  UserPlus,
  Building2,
  Loader,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import StatsCard from '../../components/StatsCard';
import PesoIcon from '../../components/PesoIcon';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalReservations: 0,
    totalCommissions: '₱0',
    roleCounts: { admins: 0, brokers: 0, agents: 0, clients: 0 }
  });
  const [recent, setRecent] = useState({
    users: [],
    properties: [],
    reservations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAdminStats();
      setStats(response.data.stats);
      setRecent(response.data.recent || { users: [], properties: [], reservations: [] });
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Total Properties',
      value: stats.totalProperties.toLocaleString(),
      icon: Home,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Active Reservations',
      value: stats.totalReservations.toLocaleString(),
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'increase'
    },
    {
      title: 'Total Commissions',
      value: stats.totalCommissions,
      icon: PesoIcon,
      color: 'bg-yellow-500',
      change: '+18%',
      changeType: 'increase'
    }
  ];

  const quickActions = [
    { title: 'Add New User', description: 'Create user account', icon: UserPlus, path: '/admin/users' },
    { title: 'Add Property', description: 'List new property', icon: Building2, path: '/admin/properties' },
    { title: 'View Reports', description: 'Generate analytics', icon: FileText, path: '/admin/reports' },
    { title: 'View Analytics', description: 'Detailed insights', icon: TrendingUp, path: '/admin/analytics' }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-soft-green" size={48} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-pastel-green">
              <p className="text-dark-text text-lg">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-4 px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-white/80 mt-1">Welcome back, {user?.name || 'Admin'}!</p>
              </div>
              <Link
                to="/admin/users"
                className="bg-white/20 text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition flex items-center gap-2 backdrop-blur-sm"
              >
                <UserPlus size={18} />
                Add User
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {statsCards.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green lg:col-span-1">
              <h2 className="text-lg font-semibold text-dark-text mb-4">User Roles</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.roleCounts.admins}</p>
                  <p className="text-xs text-gray-600">Admins</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.roleCounts.brokers}</p>
                  <p className="text-xs text-gray-600">Brokers</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.roleCounts.agents}</p>
                  <p className="text-xs text-gray-600">Agents</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{stats.roleCounts.clients}</p>
                  <p className="text-xs text-gray-600">Clients</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green lg:col-span-2">
              <h2 className="text-lg font-semibold text-dark-text mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className="flex items-center gap-3 p-3 bg-pastel-orange/30 rounded-lg hover:bg-pastel-orange transition"
                  >
                    <action.icon className="text-warm-orange" size={20} />
                    <div>
                      <p className="font-medium text-dark-text text-sm">{action.title}</p>
                      <p className="text-xs text-light-text">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-dark-text">Recent Users</h2>
                <Link to="/admin/users" className="text-sm text-soft-green hover:text-warm-orange transition">
                  View All
                </Link>
              </div>
              {recent.users?.length === 0 ? (
                <p className="text-light-text text-center py-4">No recent users</p>
              ) : (
                <div className="space-y-3">
                  {recent.users?.slice(0, 4).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-pastel-green rounded-lg hover:bg-pastel-orange/20 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-dark-text text-sm">{user.name}</p>
                          <p className="text-xs text-light-text">{user.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'broker' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'agent' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-dark-text">Recent Properties</h2>
                <Link to="/admin/properties" className="text-sm text-soft-green hover:text-warm-orange transition">
                  View All
                </Link>
              </div>
              {recent.properties?.length === 0 ? (
                <p className="text-light-text text-center py-4">No recent properties</p>
              ) : (
                <div className="space-y-3">
                  {recent.properties?.slice(0, 4).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 border border-pastel-green rounded-lg hover:bg-pastel-orange/20 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pastel-green flex items-center justify-center text-soft-green">
                          <Home size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-dark-text text-sm">{property.title}</p>
                          <p className="text-xs text-light-text">{property.location}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        property.status === 'available' ? 'bg-green-100 text-green-700' :
                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;