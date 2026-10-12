import React, { useState, useEffect } from 'react';
import {
  Loader,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  Banknote,
  CheckCircle,
  RotateCcw,
  Pencil,
  X,
  TrendingUp
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { commissionAPI } from '../../services/api';

const AdminCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingReleases, setPendingReleases] = useState([]);
  const [approvedUnpaid, setApprovedUnpaid] = useState([]);
  const [agentReleaseStatus, setAgentReleaseStatus] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Reverse modal
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseCommission, setReverseCommission] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseLoading, setReverseLoading] = useState(false);

  // Adjust amount modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustCommission, setAdjustCommission] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchAll = async () => {
    await Promise.all([
      fetchCommissions(),
      fetchPendingReleases(),
      fetchApprovedUnpaid()
    ]);
  };

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commissionAPI.getAll();
      const data = response.data.commissions || response.data || [];
      setCommissions(data);

      const statusMap = {};
      for (const c of data) {
        const agentId = c.agent_id;
        if (!agentId) continue;
        if (!statusMap[agentId]) {
          statusMap[agentId] = { pending: false, approved: false, paid: false, reversed: false };
        }
        if (c.status === 'pending') statusMap[agentId].pending = true;
        if (c.status === 'paid') statusMap[agentId].paid = true;
        if (c.status === 'reversed') statusMap[agentId].reversed = true;

        const released = parseFloat(c.total_released || 0);
        const pendingAmt = parseFloat(c.total_pending || 0);
        const earned = parseFloat(c.total_earned || c.amount || 0);

        if (released > 0) statusMap[agentId].approved = true;
        if (released >= earned && earned > 0) statusMap[agentId].paid = true;
        if (pendingAmt > 0) statusMap[agentId].pending = true;
      }

      const pendingResp = await commissionAPI.getPendingReleases();
      const approvedResp = await commissionAPI.getApprovedUnpaidReleases();
      const allReleases = [
        ...(pendingResp.data.releases || []),
        ...(approvedResp.data.releases || [])
      ];

      for (const r of allReleases) {
        const agentId = r.agent_id;
        if (!agentId) continue;
        if (!statusMap[agentId]) {
          statusMap[agentId] = { pending: false, approved: false, paid: false, reversed: false };
        }
        if (r.status === 'pending') statusMap[agentId].pending = true;
        if (r.status === 'approved') statusMap[agentId].approved = true;
        if (r.status === 'paid') statusMap[agentId].paid = true;
        if (r.status === 'cancelled') statusMap[agentId].reversed = true;
      }

      setAgentReleaseStatus(statusMap);
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReleases = async () => {
    try {
      const response = await commissionAPI.getPendingReleases();
      setPendingReleases(response.data.releases || []);
    } catch (err) {
      console.error('Error fetching pending releases:', err);
    }
  };

  const fetchApprovedUnpaid = async () => {
    try {
      const response = await commissionAPI.getApprovedUnpaidReleases();
      setApprovedUnpaid(response.data.releases || []);
    } catch (err) {
      console.error('Error fetching approved unpaid releases:', err);
    }
  };

  const formatPrice = (price) =>
    `₱${parseFloat(price || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const groupedByAgent = commissions.reduce((acc, c) => {
    const key = c.agent_id || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        agent_id: c.agent_id,
        agent_name: c.agent_name || 'Unknown Agent',
        agent_email: c.agent_email || '',
        commission_rate: c.commission_rate || 5,
        commissions: [],
        totalEarned: 0,
        totalReleased: 0,
        totalPending: 0,
        totalReversed: 0
      };
    }
    acc[key].commissions.push(c);

    if (c.status !== 'reversed') {
      acc[key].totalEarned += parseFloat(c.total_earned || c.amount || 0);
      acc[key].totalReleased += parseFloat(c.total_released || 0);
      acc[key].totalPending += parseFloat(c.total_pending || c.amount || 0);
    } else {
      acc[key].totalReversed += parseFloat(c.amount || 0);
    }
    return acc;
  }, {});

  const agents = Object.values(groupedByAgent).filter((agent) => {
    const matchesSearch =
      !searchTerm ||
      agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agent_email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;

    const statuses = agentReleaseStatus[agent.agent_id] || {};
    return Boolean(statuses[filterStatus]);
  });

  const grandTotal = {
    earned: Object.values(groupedByAgent).reduce((s, a) => s + a.totalEarned, 0),
    released: Object.values(groupedByAgent).reduce((s, a) => s + a.totalReleased, 0),
    pending: Object.values(groupedByAgent).reduce((s, a) => s + a.totalPending, 0),
    reversed: Object.values(groupedByAgent).reduce((s, a) => s + a.totalReversed, 0)
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'cancelled':
      case 'reversed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // ✅ Admin action: approve release
  const handleApprove = async (release) => {
    if (!window.confirm(`Approve "${release.milestone_name}" release of ${formatPrice(release.amount)} for ${release.agent_name}?`)) return;

    try {
      setActionLoading(`approve-${release.id}`);
      await commissionAPI.approveRelease(release.id, { notes: 'Approved by admin' });
      setToast({ type: 'success', message: '✅ Milestone approved!' });
      await fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to approve' });
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Admin action: mark release as paid
  const handleMarkPaid = async (release) => {
    if (!window.confirm(`Mark "${release.milestone_name}" release of ${formatPrice(release.amount)} as PAID for ${release.agent_name}?`)) return;

    try {
      setActionLoading(`paid-${release.id}`);
      await commissionAPI.markReleaseAsPaid(release.id, { notes: 'Paid via admin' });
      setToast({ type: 'success', message: '💰 Release marked as paid!' });
      await fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to mark as paid' });
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Admin action: reverse commission
  const openReverseModal = (commission) => {
    setReverseCommission(commission);
    setReverseReason('');
    setShowReverseModal(true);
  };

  const handleReverseSubmit = async (e) => {
    e.preventDefault();
    if (reverseReason.trim().length < 5) {
      setToast({ type: 'error', message: 'Reason must be at least 5 characters' });
      return;
    }

    setReverseLoading(true);
    try {
      await commissionAPI.reverseCommission(reverseCommission.id, {
        reason: reverseReason.trim()
      });
      setShowReverseModal(false);
      setToast({ type: 'success', message: '🔄 Commission reversed' });
      await fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to reverse' });
    } finally {
      setReverseLoading(false);
    }
  };

  // ✅ Admin action: adjust commission amount
  const openAdjustModal = (commission) => {
    setAdjustCommission(commission);
    setNewAmount(commission.amount);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!amt || amt <= 0) {
      setToast({ type: 'error', message: 'Amount must be greater than 0' });
      return;
    }
    if (adjustReason.trim().length < 5) {
      setToast({ type: 'error', message: 'Reason must be at least 5 characters' });
      return;
    }

    setAdjustLoading(true);
    try {
      await commissionAPI.adjustCommission(adjustCommission.id, {
        amount: amt,
        reason: adjustReason.trim()
      });
      setShowAdjustModal(false);
      setToast({ type: 'success', message: '✅ Commission amount adjusted' });
      await fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to adjust' });
    } finally {
      setAdjustLoading(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Commissions</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">
                Manage agent commissions, approve milestones, and adjust payouts
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-pastel-green dark:border-gray-700 rounded-lg hover:bg-pastel-green/20 dark:hover:bg-gray-700 transition text-dark-text dark:text-white"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <CheckCircle size={16} />
            <span>
              <strong>Admin access.</strong> You can approve releases, mark them as paid, reverse commissions, and adjust amounts.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="bg-gradient-to-r from-soft-green to-emerald-600 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Earned</p>
              <p className="text-2xl font-bold">{formatPrice(grandTotal.earned)}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Released</p>
              <p className="text-2xl font-bold">{formatPrice(grandTotal.released)}</p>
            </div>
            <div className="bg-gradient-to-r from-warm-orange to-amber-500 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Pending</p>
              <p className="text-2xl font-bold">{formatPrice(grandTotal.pending)}</p>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Reversed</p>
              <p className="text-2xl font-bold">{formatPrice(grandTotal.reversed)}</p>
            </div>
          </div>

          {pendingReleases.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  {pendingReleases.length} Pending Milestone Release{pendingReleases.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-2">
                {pendingReleases.map((release) => (
                  <div key={release.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-amber-100 dark:border-amber-900">
                    <div className="flex-1">
                      <p className="font-medium text-dark-text dark:text-white">
                        {release.milestone_name || 'Milestone'} — {release.agent_name}
                      </p>
                      <p className="text-xs text-light-text dark:text-gray-400">
                        {release.property_title} · {formatPrice(release.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge('pending')}`}>
                        pending
                      </span>
                      <button
                        onClick={() => handleApprove(release)}
                        disabled={actionLoading === `approve-${release.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === `approve-${release.id}` ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approvedUnpaid.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={20} className="text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  {approvedUnpaid.length} Approved Release{approvedUnpaid.length > 1 ? 's' : ''} Waiting to be Paid
                </h3>
              </div>
              <div className="space-y-2">
                {approvedUnpaid.map((release) => (
                  <div key={release.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-blue-100 dark:border-blue-900">
                    <div className="flex-1">
                      <p className="font-medium text-dark-text dark:text-white">
                        {release.milestone_name || 'Milestone'} — {release.agent_name}
                      </p>
                      <p className="text-xs text-light-text dark:text-gray-400">
                        {release.property_title} · {formatPrice(release.amount)}
                        {release.approved_by_name && ` · approved by ${release.approved_by_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge('approved')}`}>
                        approved
                      </span>
                      <button
                        onClick={() => handleMarkPaid(release)}
                        disabled={actionLoading === `paid-${release.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === `paid-${release.id}` ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <Banknote size={14} />
                        )}
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-pastel-green dark:border-gray-700 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search agent by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Has Pending Releases</option>
              <option value="approved">Has Approved (Unpaid) Releases</option>
              <option value="paid">Has Paid Releases</option>
              <option value="reversed">Has Reversed Commissions</option>
            </select>
          </div>

          {agents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-pastel-green dark:border-gray-700">
              <PesoIcon size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
              <p className="text-light-text dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'No agents match your filters'
                  : 'No commission records found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div
                  key={agent.agent_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedAgent(
                        expandedAgent === agent.agent_id ? null : agent.agent_id
                      )
                    }
                    className="w-full p-5 flex items-center justify-between hover:bg-pastel-orange/10 dark:hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className="w-12 h-12 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {agent.agent_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-dark-text dark:text-white">
                            {agent.agent_name}
                          </h3>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                            {agent.commission_rate}% rate
                          </span>
                        </div>
                        <p className="text-sm text-light-text dark:text-gray-400 truncate">
                          {agent.agent_email}
                        </p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 mr-4">
                      <div className="text-right">
                        <p className="text-xs text-light-text dark:text-gray-400">Earned</p>
                        <p className="font-bold text-dark-text dark:text-white">
                          {formatPrice(agent.totalEarned)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-light-text dark:text-gray-400">Released</p>
                        <p className="font-bold text-emerald-600">
                          {formatPrice(agent.totalReleased)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-light-text dark:text-gray-400">Pending</p>
                        <p className="font-bold text-amber-600">
                          {formatPrice(agent.totalPending)}
                        </p>
                      </div>
                      {agent.totalReversed > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-light-text dark:text-gray-400">Reversed</p>
                          <p className="font-bold text-red-600">
                            -{formatPrice(agent.totalReversed)}
                          </p>
                        </div>
                      )}
                    </div>

                    {expandedAgent === agent.agent_id ? (
                      <ChevronUp size={20} className="text-light-text dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-light-text dark:text-gray-400" />
                    )}
                  </button>

                  {expandedAgent === agent.agent_id && (
                    <div className="border-t border-pastel-green dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="text-sm font-semibold text-dark-text dark:text-white mb-3">
                        Commission Records ({agent.commissions.length})
                      </h4>
                      <div className="space-y-2">
                        {agent.commissions.map((c) => (
                          <div
                            key={c.id}
                            className={`rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border ${
                              c.status === 'reversed'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-white dark:bg-gray-800 border-pastel-green dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {c.status === 'reversed' ? (
                                <RotateCcw size={16} className="text-red-500 flex-shrink-0" />
                              ) : (
                                <Briefcase size={16} className="text-soft-green flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${
                                  c.status === 'reversed'
                                    ? 'text-red-700 dark:text-red-300 line-through'
                                    : 'text-dark-text dark:text-white'
                                }`}>
                                  {c.property_title || 'Unknown Property'}
                                </p>
                                <p className="text-xs text-light-text dark:text-gray-400">
                                  {new Date(c.created_at).toLocaleDateString()}
                                  {c.status === 'reversed' && c.reversal_reason && (
                                    <span className="ml-1" title={c.reversal_reason}>
                                      · Reason: {c.reversal_reason.substring(0, 40)}
                                      {c.reversal_reason.length > 40 ? '...' : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className={`font-semibold ${
                                c.status === 'reversed'
                                  ? 'text-red-600 dark:text-red-400 line-through'
                                  : 'text-dark-text dark:text-white'
                              }`}>
                                {formatPrice(c.amount)}
                              </p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(c.status)}`}>
                                {c.status === 'reversed' ? '🔄 reversed' : c.status}
                              </span>
                              {c.status !== 'reversed' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openAdjustModal(c)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                    title="Adjust amount"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => openReverseModal(c)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                    title="Reverse commission"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Reverse Modal */}
      {showReverseModal && reverseCommission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full border border-red-200 dark:border-red-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white flex items-center gap-2">
                <RotateCcw size={22} className="text-red-500" />
                Reverse Commission
              </h2>
              <button onClick={() => setShowReverseModal(false)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold text-red-800 dark:text-red-300 mb-1">⚠️ Warning:</p>
              <ul className="text-red-700 dark:text-red-400 space-y-1 ml-4 list-disc">
                <li>Commission of <strong>{formatPrice(reverseCommission.amount)}</strong> will be marked as reversed</li>
                <li>All pending/approved releases will be cancelled</li>
                <li>The agent will be notified</li>
              </ul>
            </div>

            <p className="text-sm text-light-text dark:text-gray-400 mb-4">
              Property: <span className="font-medium text-dark-text dark:text-white">{reverseCommission.property_title}</span>
            </p>

            <form onSubmit={handleReverseSubmit}>
              <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white resize-none mb-4"
                placeholder="e.g., Correction — wrong agent credited"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReverseModal(false)}
                  disabled={reverseLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reverseLoading || reverseReason.trim().length < 5}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {reverseLoading ? <Loader className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                  {reverseLoading ? 'Reversing...' : 'Confirm Reverse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && adjustCommission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full border border-blue-200 dark:border-blue-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white flex items-center gap-2">
                <Pencil size={22} className="text-blue-500" />
                Adjust Commission Amount
              </h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 text-sm">
              <p className="text-blue-800 dark:text-blue-300">
                Current amount: <strong>{formatPrice(adjustCommission.amount)}</strong>
              </p>
              <p className="text-blue-700 dark:text-blue-400 mt-1">
                Property: <strong>{adjustCommission.property_title}</strong>
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                New Amount (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white mb-4"
                required
              />

              <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white resize-none mb-4"
                placeholder="e.g., Corrected agent rate from 5% to 6%"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading || !newAmount || adjustReason.trim().length < 5}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {adjustLoading ? <Loader className="animate-spin" size={16} /> : <Pencil size={16} />}
                  {adjustLoading ? 'Saving...' : 'Save Amount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommissions;