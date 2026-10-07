import React, { useState, useEffect } from 'react';
import { Users, Home, Calendar, Loader, TrendingUp, Award } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { dashboardAPI } from '../../services/api';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalReservations: 0,
    totalCommissions: '₱0'
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [propertyStats, setPropertyStats] = useState({ byType: [], byStatus: [] });
  const [reservationStats, setReservationStats] = useState({ total: 0, byStatus: [], monthly: [] });
  const [topAgents, setTopAgents] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [adminRes, activityRes, propertyRes, reservationRes, agentsRes] = await Promise.all([
        dashboardAPI.getAdminStats(),
        dashboardAPI.getUserActivity(180),
        dashboardAPI.getPropertyStats(),
        dashboardAPI.getReservationStats(),
        dashboardAPI.getTopAgents()
      ]);

      setStats(adminRes.data.stats || {});

      const activity = (activityRes.data || []).slice().reverse();
      setUserGrowth(
        activity.map((row) => ({
          date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: parseInt(row.new_users, 10) || 0
        }))
      );

      // ✅ FIX: Convert count strings to numbers
      setPropertyStats({
        byType: (propertyRes.data.byType || []).map((r) => ({
          name: r.type,
          value: parseInt(r.count, 10) || 0
        })),
        byStatus: (propertyRes.data.byStatus || []).map((r) => ({
          name: r.status,
          value: parseInt(r.count, 10) || 0
        }))
      });

      // ✅ FIX: Convert count strings to numbers here too
      setReservationStats({
        total: parseInt(reservationRes.data.total, 10) || 0,
        byStatus: (reservationRes.data.byStatus || []).map((r) => ({
          name: r.status,
          value: parseInt(r.count, 10) || 0
        })),
        monthly: (reservationRes.data.monthly || []).map((r) => ({
          month: r.month,
          count: parseInt(r.count, 10) || 0
        }))
      });

      setTopAgents(
        (agentsRes.data.agents || []).map((a) => ({
          name: a.name,
          properties: parseInt(a.total_properties, 10) || 0,
          completed: parseInt(a.completed_reservations, 10) || 0,
          earned: parseFloat(a.total_earned) || 0,
          paid: parseFloat(a.total_paid) || 0
        }))
      );
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const kpiCards = [
    { title: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { title: 'Total Properties', value: stats.totalProperties || 0, icon: Home, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
    { title: 'Reservations', value: reservationStats.total || stats.totalReservations || 0, icon: Calendar, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' },
    { title: 'Total Commissions', value: stats.totalCommissions || '₱0', icon: PesoIcon, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text dark:text-white">Analytics</h1>
            <p className="text-light-text dark:text-gray-400 mt-1">View system performance and statistics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {kpiCards.map((card, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon size={24} />
                  </div>
                  <TrendingUp className="text-soft-green" size={20} />
                </div>
                <h3 className="text-light-text dark:text-gray-400 text-sm mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-dark-text dark:text-white">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-4">User Growth (Last 6 Months)</h3>
              <div className="h-64">
                {userGrowth.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-light-text dark:text-gray-400">No user data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-4">Properties by Type</h3>
              <div className="h-64">
                {propertyStats.byType.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-light-text dark:text-gray-400">No property data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={propertyStats.byType} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {propertyStats.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-4">Reservations (Last 6 Months)</h3>
              <div className="h-64">
                {reservationStats.monthly.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-light-text dark:text-gray-400">No reservation data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reservationStats.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-4">Properties by Status</h3>
              <div className="h-64">
                {propertyStats.byStatus.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-light-text dark:text-gray-400">No property data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={propertyStats.byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {propertyStats.byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-warm-orange" size={22} />
              <h3 className="text-lg font-semibold text-dark-text dark:text-white">Top Performing Agents</h3>
            </div>
            <div className="h-72">
              {topAgents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-light-text dark:text-gray-400">No agent data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAgents} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="completed" fill="#10b981" name="Completed Reservations" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="properties" fill="#f59e0b" name="Properties" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {topAgents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-pastel-green dark:border-gray-700">
                <h3 className="text-lg font-semibold text-dark-text dark:text-white">Agent Performance Breakdown</h3>
              </div>
              <table className="w-full">
                <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Properties</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                  {topAgents.map((agent, index) => (
                    <tr key={index} className="hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 text-sm text-dark-text dark:text-white font-medium">{agent.name}</td>
                      <td className="px-6 py-4 text-sm text-light-text dark:text-gray-400">{agent.properties}</td>
                      <td className="px-6 py-4 text-sm text-light-text dark:text-gray-400">{agent.completed}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-soft-green">{formatPrice(agent.earned)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatPrice(agent.paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;