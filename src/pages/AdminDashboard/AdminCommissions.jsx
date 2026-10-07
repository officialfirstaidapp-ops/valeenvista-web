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
  Eye
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
  const [agentReleaseStatus, setAgentReleaseStatus] = useState({}); // { agent_id: { pending, approved, paid } }

  useEffect(() => {
    fetchAll();
  }, []);

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

      // ✅ Build a map: for each agent, what statuses exist in their releases?
      const statusMap = {};
      for (const c of data) {
        const agentId = c.agent_id;
        if (!agentId) continue;
        if (!statusMap[agentId]) {
          statusMap[agentId] = { pending: false, approved: false, paid: false };
        }
        // Base on commission row status
        if (c.status === 'pending') statusMap[agentId].pending = true;
        if (c.status === 'paid') statusMap[agentId].paid = true;

        // Also infer from totals: if released > 0, they have approved/paid releases
        const released = parseFloat(c.total_released || 0);
        const pendingAmt = parseFloat(c.total_pending || 0);
        const earned = parseFloat(c.total_earned || c.amount || 0);

        if (released > 0) statusMap[agentId].approved = true;
        if (released >= earned && earned > 0) statusMap[agentId].paid = true;
        if (pendingAmt > 0) statusMap[agentId].pending = true;
      }

      // ✅ Also mark agents from pending/approved banners
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
          statusMap[agentId] = { pending: false, approved: false, paid: false };
        }
        if (r.status === 'pending') statusMap[agentId].pending = true;
        if (r.status === 'approved') statusMap[agentId].approved = true;
        if (r.status === 'paid') statusMap[agentId].paid = true;
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
        totalPending: 0
      };
    }
    acc[key].commissions.push(c);
    acc[key].totalEarned += parseFloat(c.total_earned || c.amount || 0);
    acc[key].totalReleased += parseFloat(c.total_released || 0);
    acc[key].totalPending += parseFloat(c.total_pending || c.amount || 0);
    return acc;
  }, {});

  const agents = Object.values(groupedByAgent).filter((agent) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agent_email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter (based on release statuses, not parent commission)
    if (filterStatus === 'all') return true;

    const statuses = agentReleaseStatus[agent.agent_id] || {};
    return Boolean(statuses[filterStatus]);
  });

  const grandTotal = {
    earned: Object.values(groupedByAgent).reduce((s, a) => s + a.totalEarned, 0),
    released: Object.values(groupedByAgent).reduce((s, a) => s + a.totalReleased, 0),
    pending: Object.values(groupedByAgent).reduce((s, a) => s + a.totalPending, 0)
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
                Read-only overview of agent commissions and milestone releases
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-pastel-green dark:border-gray-700 rounded-lg hover:bg-pastel-green/20 dark:hover:bg-gray-700 transition text-dark-text dark:text-white"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          {/* Read-only notice */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Eye size={16} />
            <span>
              <strong>View only.</strong> Milestone approvals and payouts are handled by the broker.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div className="bg-gradient-to-r from-soft-green to-emerald-600 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Earned</p>
              <p className="text-3xl font-bold">{formatPrice(grandTotal.earned)}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Released</p>
              <p className="text-3xl font-bold">{formatPrice(grandTotal.released)}</p>
            </div>
            <div className="bg-gradient-to-r from-warm-orange to-amber-500 rounded-lg shadow-md p-6 text-white">
              <p className="text-sm opacity-90">Total Pending</p>
              <p className="text-3xl font-bold">{formatPrice(grandTotal.pending)}</p>
            </div>
          </div>

          {/* Pending Releases — view only */}
          {pendingReleases.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  {pendingReleases.length} Pending Milestone Release
                  {pendingReleases.length > 1 ? 's' : ''}
                </h3>
                <span className="ml-auto text-xs text-amber-700 dark:text-amber-400 italic">
                  Waiting for broker approval
                </span>
              </div>
              <div className="space-y-2">
                {pendingReleases.map((release) => (
                  <div
                    key={release.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-amber-100 dark:border-amber-900"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-dark-text dark:text-white">
                        {release.milestone_name || 'Milestone'} — {release.agent_name}
                      </p>
                      <p className="text-xs text-light-text dark:text-gray-400">
                        {release.property_title} · {formatPrice(release.amount)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge('pending')}`}>
                      pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Unpaid — view only */}
          {approvedUnpaid.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={20} className="text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  {approvedUnpaid.length} Approved Release
                  {approvedUnpaid.length > 1 ? 's' : ''} Waiting to be Paid
                </h3>
                <span className="ml-auto text-xs text-blue-700 dark:text-blue-400 italic">
                  Broker will mark as paid
                </span>
              </div>
              <div className="space-y-2">
                {approvedUnpaid.map((release) => (
                  <div
                    key={release.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-blue-100 dark:border-blue-900"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-dark-text dark:text-white">
                        {release.milestone_name || 'Milestone'} — {release.agent_name}
                      </p>
                      <p className="text-xs text-light-text dark:text-gray-400">
                        {release.property_title} · {formatPrice(release.amount)}
                        {release.approved_by_name && ` · approved by ${release.approved_by_name}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge('approved')}`}>
                      approved
                    </span>
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

          {/* Filters */}
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
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-pastel-green dark:border-gray-700"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Briefcase
                                size={16}
                                className="text-soft-green flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-dark-text dark:text-white truncate">
                                  {c.property_title || 'Unknown Property'}
                                </p>
                                <p className="text-xs text-light-text dark:text-gray-400">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-dark-text dark:text-white">
                                {formatPrice(c.amount)}
                              </p>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(
                                  c.status
                                )}`}
                              >
                                {c.status}
                              </span>
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
    </div>
  );
};

export default AdminCommissions;