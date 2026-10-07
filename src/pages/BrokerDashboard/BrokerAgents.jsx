import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader,
  RefreshCw,
  Search,
  X,
  XCircle,
  Save,
  Mail,
  Phone,
  UserPlus,
  CheckCircle,
  Percent
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BrokerAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    commission_rate: 5
  });
  const [addingAgent, setAddingAgent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getByRole('agent');
      setAgents(response.data.users || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    setAddingAgent(true);
    setError(null);

    try {
      const agentData = {
        name: newAgent.name,
        email: newAgent.email,
        password: newAgent.password,
        phone: newAgent.phone || null,
        role: 'agent',
        broker_id: user?.id,
        commission_rate: parseFloat(newAgent.commission_rate) || 5
      };
      
      await userAPI.create(agentData);
      
      setSuccessMessage('✅ Agent added successfully!');
      setNewAgent({ name: '', email: '', password: '', phone: '', commission_rate: 5 });
      setShowAddModal(false);
      fetchAgents();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err.response?.data?.error || 'Failed to add agent');
    } finally {
      setAddingAgent(false);
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    try {
      await userAPI.update(editingAgent.id, {
        name: editingAgent.name,
        phone: editingAgent.phone,
        commission_rate: parseFloat(editingAgent.commission_rate) || 5
      });
      setEditingAgent(null);
      fetchAgents();
      setSuccessMessage('✅ Agent updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating agent:', err);
      setError('Failed to update agent');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAgent = async () => {
    try {
      await userAPI.delete(agentToDelete.id);
      setShowDeleteModal(false);
      setAgentToDelete(null);
      fetchAgents();
      setSuccessMessage('✅ Agent deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete agent');
    }
  };

  const filteredAgents = agents.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Agents</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">Manage your team of agents</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
              >
                <UserPlus size={18} />
                Add Agent
              </button>
              <button
                onClick={fetchAgents}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-pastel-green dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search agents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900 underline">
                Dismiss
              </button>
            </div>
          )}

          {filteredAgents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-pastel-green dark:border-gray-700">
              <Users size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
              <p className="text-light-text dark:text-gray-400">
                {searchTerm ? 'No agents match your search' : 'No agents yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-block px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
                >
                  Add Your First Agent
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Commission Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold">
                              {agent.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="font-medium text-dark-text dark:text-white">{agent.name}</p>
                              <p className="text-xs text-light-text dark:text-gray-400">ID: {agent.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-light-text dark:text-gray-400">
                            <div className="flex items-center gap-1 mb-1">
                              <Mail size={14} />
                              {agent.email}
                            </div>
                            {agent.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                {agent.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 w-fit">
                            <Percent size={14} />
                            {agent.commission_rate || 5}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingAgent(agent)}
                              className="text-soft-green hover:text-warm-orange transition"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setAgentToDelete(agent);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-dark-text dark:text-white">Add New Agent</h3>
              <button onClick={() => setShowAddModal(false)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAgent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Password *</label>
                  <input
                    type="password"
                    value={newAgent.password}
                    onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                    Commission Rate (%) *
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newAgent.commission_rate}
                      onChange={(e) => setNewAgent({ ...newAgent, commission_rate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      required
                    />
                  </div>
                  <p className="text-xs text-light-text dark:text-gray-400 mt-1">
                    The percentage this agent earns from each completed transaction
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-light-text dark:text-gray-400 hover:bg-pastel-orange rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAgent}
                  className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
                >
                  {addingAgent ? <Loader className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  {addingAgent ? 'Adding...' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-dark-text dark:text-white">Edit Agent</h3>
              <button onClick={() => setEditingAgent(null)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateAgent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingAgent.name || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editingAgent.phone || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                    Commission Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editingAgent.commission_rate || 5}
                      onChange={(e) => setEditingAgent({ ...editingAgent, commission_rate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-light-text dark:text-gray-400 hover:bg-pastel-orange rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && agentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-dark-text dark:text-white">Delete Agent</h3>
            </div>
            <p className="text-light-text dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-dark-text dark:text-white">{agentToDelete.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-light-text dark:text-gray-400 hover:bg-pastel-orange rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAgent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerAgents;