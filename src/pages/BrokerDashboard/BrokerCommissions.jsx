import React, { useState, useEffect } from 'react';
import {
  Loader,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Banknote,
  History,
  Lock,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { commissionAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const BrokerCommissions = () => {
  const { formatPrice } = useTheme();

  const [activeTab, setActiveTab] = useState('pending');
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchReleases();
  }, [activeTab]);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commissionAPI.getBrokerReleases(activeTab);
      setReleases(response.data.releases || []);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError('Failed to load releases');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (releaseId) => {
    if (!window.confirm('Approve this milestone release? The amount will be marked ready for payout.')) return;

    try {
      setActionLoading(releaseId);
      await commissionAPI.approveRelease(releaseId, { notes: 'Approved by broker' });
      setSuccessMessage('✅ Milestone approved!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchReleases();
    } catch (err) {
      console.error('Approve failed:', err);
      alert(err.response?.data?.error || 'Failed to approve release');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async (releaseId) => {
    if (!window.confirm('Mark this release as PAID? This confirms you have paid the agent.')) return;

    try {
      setActionLoading(releaseId);
      await commissionAPI.markReleaseAsPaid(releaseId, { notes: 'Paid by broker' });
      setSuccessMessage('💰 Release marked as paid!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchReleases();
    } catch (err) {
      console.error('Mark paid failed:', err);
      alert(err.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ Total amount in current tab
  const totalAmount = releases.reduce(
    (sum, r) => sum + parseFloat(r.amount || 0),
    0
  );

  // ✅ Grand total commission (unique per commission_id)
  const totalCommissionMap = {};
  releases.forEach((r) => {
    if (r.commission_id && !totalCommissionMap[r.commission_id]) {
      totalCommissionMap[r.commission_id] = parseFloat(r.commission_total || 0);
    }
  });
  const grandTotalCommission = Object.values(totalCommissionMap).reduce(
    (sum, v) => sum + v,
    0
  );

  const uniqueCommissionCount = Object.keys(totalCommissionMap).length;

  const tabs = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'approved', label: 'Approved (Unpaid)', icon: Banknote },
    { key: 'paid', label: 'Paid', icon: CheckCircle },
  ];

  const headerGradient = {
    pending: 'from-amber-500 to-warm-orange',
    approved: 'from-blue-500 to-blue-600',
    paid: 'from-emerald-500 to-soft-green',
  }[activeTab];

  const headerLabel = {
    pending: 'Pending Releases',
    approved: 'Approved — Waiting to be Paid',
    paid: 'Paid History',
  }[activeTab];

  const headerSubtext = {
    pending: 'Review and approve agent milestone payouts',
    approved: 'Mark these releases as paid after paying the agent',
    paid: 'Your payout history for agent commissions',
  }[activeTab];

  const emptyMessage = {
    pending: 'All caught up! No pending releases right now',
    approved: 'No approved releases waiting to be paid',
    paid: 'No paid releases yet',
  }[activeTab];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="broker" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Commissions</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">{headerSubtext}</p>
            </div>
            <button
              onClick={fetchReleases}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} /> {successMessage}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 border border-pastel-green dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition border-b-2 ${
                      isActive
                        ? 'border-soft-green text-soft-green bg-soft-green/5 dark:bg-emerald-900/20'
                        : 'border-transparent text-light-text dark:text-gray-400 hover:bg-pastel-green/20 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✅ Summary cards — 2 cards: Tab Amount + Total Commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Card 1: Amount in this tab */}
            <div className={`bg-gradient-to-r ${headerGradient} rounded-lg shadow-md p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  {(() => {
                    const Icon = tabs.find(t => t.key === activeTab)?.icon || Clock;
                    return <Icon size={32} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm opacity-90">{headerLabel}</p>
                  <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {releases.length} {releases.length === 1 ? 'release' : 'releases'}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ Card 2: Grand Total Commission — GREEN gradient */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Wallet size={32} />
                </div>
                <div>
                  <p className="text-sm opacity-90">Total Commission</p>
                  <p className="text-3xl font-bold">{formatPrice(grandTotalCommission)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Across {uniqueCommissionCount} {uniqueCommissionCount === 1 ? 'property' : 'properties'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
              <button onClick={fetchReleases} className="ml-auto underline hover:no-underline">Try Again</button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader className="animate-spin text-soft-green" size={48} />
              </div>
            ) : releases.length === 0 ? (
              <div className="p-12 text-center">
                {activeTab === 'pending' ? (
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                ) : activeTab === 'approved' ? (
                  <Banknote size={48} className="mx-auto text-blue-500 mb-4" />
                ) : (
                  <History size={48} className="mx-auto text-emerald-500 mb-4" />
                )}
                <p className="text-dark-text dark:text-white font-medium text-lg">
                  {activeTab === 'pending' ? 'All caught up!' : 'Nothing here yet'}
                </p>
                <p className="text-light-text dark:text-gray-400 mt-1">{emptyMessage}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Milestone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Amount</th>
                      {activeTab === 'pending' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Payment Progress</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-dark-text dark:text-white uppercase">
                        {activeTab === 'pending' ? 'Action' : activeTab === 'approved' ? 'Payout' : 'Paid By'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                    {releases.map((release) => {
                      const canApprove = release.can_approve !== false;
                      const paidPercent = parseFloat(release.paid_percent || 0);
                      const triggerPct = parseFloat(release.trigger_percent || 0);

                      return (
                        <tr key={release.id} className="hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-soft-green flex items-center justify-center text-white text-sm font-semibold">
                                {release.agent_name?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <span className="text-sm text-dark-text dark:text-white">{release.agent_name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-dark-text dark:text-white">{release.property_title || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-dark-text dark:text-white">{release.milestone_name}</p>
                              <p className="text-xs text-light-text dark:text-gray-400">{release.milestone_percent}%</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-soft-green">
                              {formatPrice(release.amount)}
                            </p>
                            {/* ✅ Commission total under the amount */}
                            {release.commission_total ? (
                              <p className="text-[11px] text-light-text dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <TrendingUp size={10} />
                                Total: {formatPrice(release.commission_total)}
                              </p>
                            ) : null}
                          </td>

                          {activeTab === 'pending' && (
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-light-text dark:text-gray-400">
                                    {paidPercent.toFixed(1)}% paid
                                  </span>
                                  <span className="text-light-text dark:text-gray-400">
                                    needs {triggerPct}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      canApprove ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(paidPercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-4 text-sm text-light-text dark:text-gray-400">
                            {activeTab === 'pending' && formatDate(release.created_at)}
                            {activeTab === 'approved' && formatDate(release.approved_at)}
                            {activeTab === 'paid' && formatDate(release.paid_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {activeTab === 'pending' && (
                              <button
                                onClick={() => handleApprove(release.id)}
                                disabled={actionLoading === release.id || !canApprove}
                                title={!canApprove ? `Client needs to pay at least ${triggerPct}% first` : 'Approve this release'}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
                                  canApprove
                                    ? 'bg-soft-green text-white hover:bg-warm-orange'
                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                } disabled:opacity-60`}
                              >
                                {actionLoading === release.id ? (
                                  <Loader className="animate-spin" size={16} />
                                ) : canApprove ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <Lock size={16} />
                                )}
                                {canApprove ? 'Approve' : 'Locked'}
                              </button>
                            )}
                            {activeTab === 'approved' && (
                              <button
                                onClick={() => handleMarkAsPaid(release.id)}
                                disabled={actionLoading === release.id}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                              >
                                {actionLoading === release.id ? <Loader className="animate-spin" size={16} /> : <Banknote size={16} />}
                                Mark as Paid
                              </button>
                            )}
                            {activeTab === 'paid' && (
                              <span className="text-xs text-light-text dark:text-gray-400">
                                {release.paid_by_name || 'Broker'}
                              </span>
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
    </div>
  );
};

export default BrokerCommissions;