import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, TrendingUp, Clock, XCircle, CheckCircle, Lock, Unlock, Archive, RotateCcw } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { reservationAPI, commissionAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AgentCommissions = () => {
  const { formatPrice } = useTheme();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ earned: 0, released: 0, pending: 0, reversed: 0 });
  const [showArchived, setShowArchived] = useState(false);   // ✅ NEW
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [selectedReleases, setSelectedReleases] = useState([]);
  const [showReleasesModal, setShowReleasesModal] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, [showArchived]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reservationAPI.getMyCommissions?.() || { data: [] };
      let commissionList = response.data.commissions || [];

      // ✅ Client-side filter for reversed (since backend returns all)
      if (!showArchived) {
        commissionList = commissionList.filter(c => c.status !== 'reversed');
      }

      setCommissions(commissionList);

      let totalEarned = 0;
      let totalReleased = 0;
      let totalPending = 0;
      let totalReversed = 0;

      commissionList.forEach(c => {
        if (c.status === 'reversed') {
          totalReversed += parseFloat(c.amount || 0);
        } else {
          totalEarned += parseFloat(c.total_earned || c.amount || 0);
          totalReleased += parseFloat(c.total_released || 0);
          totalPending += parseFloat(c.total_pending || c.amount || 0);
        }
      });

      setStats({ earned: totalEarned, released: totalReleased, pending: totalPending, reversed: totalReversed });
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const viewReleases = async (commission) => {
    try {
      const response = await commissionAPI.getCommissionReleases(commission.id);
      setSelectedReleases(response.data.releases || []);
      setSelectedCommission(commission);
      setShowReleasesModal(true);
    } catch (err) {
      console.error('Error fetching releases:', err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (status === 'approved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    if (status === 'reversed' || status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Commissions</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">Track your earnings and releases</p>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ Show archived toggle */}
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-soft-green focus:ring-soft-green"
                />
                <Archive size={16} className="text-amber-600" />
                <span className="text-sm text-dark-text dark:text-white font-medium">Show archived</span>
              </label>
              <button onClick={fetchCommissions} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700">
                <RefreshCw size={18} /> Refresh
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-${stats.reversed > 0 ? 4 : 3} gap-6 mb-6`}>
            <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} />
                <div>
                  <p className="text-sm opacity-80">Total Earned</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.earned)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-light-text dark:text-gray-400">Released to You</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.released)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                  <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-light-text dark:text-gray-400">Pending Release</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatPrice(stats.pending)}</p>
                </div>
              </div>
            </div>
            {stats.reversed > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                    <RotateCcw size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-light-text dark:text-gray-400">Reversed</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{formatPrice(stats.reversed)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700">
            <div className="p-4 border-b border-pastel-green dark:border-gray-700">
              <h2 className="text-lg font-semibold text-dark-text dark:text-white">Commission History</h2>
            </div>
            {commissions.length === 0 ? (
              <div className="p-12 text-center">
                <PesoIcon size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
                <p className="text-light-text dark:text-gray-400">No commission history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Property</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Total Earned</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Released</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Pending</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                    {commissions.map((commission) => {
                      const isReversed = commission.status === 'reversed';
                      return (
                        <tr key={commission.id} className={`transition ${isReversed ? 'bg-red-50 dark:bg-red-900/20 opacity-75' : 'hover:bg-pastel-orange/20 dark:hover:bg-gray-700'}`}>
                          <td className={`px-4 py-3 text-sm ${isReversed ? 'text-red-700 dark:text-red-300 line-through' : 'text-dark-text dark:text-white'}`}>
                            {commission.property_title || 'N/A'}
                            {isReversed && commission.reversal_reason && (
                              <p className="text-xs text-red-600 dark:text-red-400 no-underline mt-1" title={commission.reversal_reason}>
                                Reason: {commission.reversal_reason.substring(0, 40)}{commission.reversal_reason.length > 40 ? '...' : ''}
                              </p>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm font-semibold ${isReversed ? 'text-red-500 line-through' : 'text-dark-text dark:text-white'}`}>
                            {formatPrice(commission.total_earned || commission.amount)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-semibold ${isReversed ? 'text-red-500 line-through' : 'text-green-600 dark:text-green-400'}`}>
                            {formatPrice(commission.total_released || 0)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-semibold ${isReversed ? 'text-red-500 line-through' : 'text-yellow-600 dark:text-yellow-400'}`}>
                            {formatPrice(commission.total_pending || commission.amount || 0)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(commission.status)}`}>
                              {isReversed ? '🔄 reversed' : commission.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!isReversed && (
                              <button onClick={() => viewReleases(commission)} className="text-soft-green hover:text-warm-orange transition text-sm flex items-center gap-1">
                                <Unlock size={14} /> View Milestones
                              </button>
                            )}
                            {isReversed && (
                              <span className="text-xs text-light-text dark:text-gray-400">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Releases Modal */}
      {showReleasesModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white">Milestone Breakdown</h2>
              <button onClick={() => setShowReleasesModal(false)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"><XCircle size={20} /></button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-light-text dark:text-gray-400">Property:</p>
              <p className="font-semibold text-dark-text dark:text-white">{selectedCommission.property_title}</p>
              <p className="text-sm text-light-text dark:text-gray-400 mt-2">Total Commission:</p>
              <p className="font-semibold text-soft-green text-lg">{formatPrice(selectedCommission.total_earned || selectedCommission.amount)}</p>
            </div>

            <div className="space-y-3">
              {selectedReleases.map((release) => {
                const isApproved = release.status === 'approved';
                const isCancelled = release.status === 'cancelled';
                return (
                  <div key={release.id} className={`p-4 rounded-lg border-2 ${
                    isCancelled ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' :
                    isApproved ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' :
                    'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {isCancelled ? <RotateCcw className="text-red-600 dark:text-red-400" size={24} /> :
                         isApproved ? <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} /> :
                         <Lock className="text-yellow-600 dark:text-yellow-400" size={24} />}
                        <div>
                          <p className={`font-semibold ${isCancelled ? 'text-red-700 dark:text-red-300 line-through' : 'text-dark-text dark:text-white'}`}>
                            {release.milestone_name}
                          </p>
                          <p className="text-sm text-light-text dark:text-gray-400">{release.milestone_percent}% of total commission</p>
                          {release.approved_at && !isCancelled && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              Approved: {formatDate(release.approved_at)}
                              {release.approved_by_name && ` by ${release.approved_by_name}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          isCancelled ? 'text-red-600 dark:text-red-400 line-through' :
                          isApproved ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {formatPrice(release.amount)}
                        </p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(release.status)}`}>{release.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowReleasesModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCommissions;