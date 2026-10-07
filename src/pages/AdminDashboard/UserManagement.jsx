import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  X,
  Check,
  Loader,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  Shield,
  AlertCircle,
  User,
  Briefcase,
  Percent,
  Edit2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AddUserModal from '../../components/AddUserModal';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // ✅ Inline commission editing state
  const [editingCommissionId, setEditingCommissionId] = useState(null);
  const [commissionDraft, setCommissionDraft] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBrokers();
  }, [pagination.page, selectedRole, searchTerm]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5000${avatarPath}`;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        search: searchTerm || undefined
      };
      
      const response = await userAPI.getAll(params);
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit)
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const response = await userAPI.getByRole('broker');
      setBrokers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching brokers:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!newRole) return;

    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    
    try {
      await userAPI.changeRole(userId, { role: newRole });
      setSuccessMessage('User role updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Failed to change user role');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userAPI.delete(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleAddUser = async (userData) => {
    try {
      await userAPI.create(userData);
      setSuccessMessage('User created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create user';
      return { success: false, error: message };
    }
  };

  // ✅ Commission editing
  const startEditCommission = (user) => {
    setEditingCommissionId(user.id);
    setCommissionDraft(user.commission_rate ?? 5);
  };

  const cancelEditCommission = () => {
    setEditingCommissionId(null);
    setCommissionDraft('');
  };

  const saveEditCommission = async (userId) => {
    const value = parseFloat(commissionDraft);
    if (isNaN(value) || value < 0 || value > 100) {
      alert('Commission rate must be between 0 and 100');
      return;
    }

    try {
      setSavingCommission(true);
      await userAPI.update(userId, { commission_rate: value });
      setSuccessMessage('Commission rate updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingCommissionId(null);
      setCommissionDraft('');
      fetchUsers();
    } catch (err) {
      console.error('Error updating commission:', err);
      alert(err.response?.data?.error || 'Failed to update commission rate');
    } finally {
      setSavingCommission(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'broker': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={14} className="mr-1" />;
      case 'broker': return <Briefcase size={14} className="mr-1" />;
      case 'agent': return <User size={14} className="mr-1" />;
      default: return <User size={14} className="mr-1" />;
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

  if (loading && users.length === 0) {
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
          {/* Header */}
          <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-white/80 mt-1">Manage all users and their roles</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white/20 text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition flex items-center gap-2 backdrop-blur-sm"
              >
                <UserPlus size={18} />
                Add New User
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <Check size={18} />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-pastel-green dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="broker">Broker</option>
                  <option value="agent">Agent</option>
                  <option value="client">Client</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-light-text dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {user.avatar ? (
                              <img
                                src={getAvatarUrl(user.avatar)}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-dark-text dark:text-white">
                                {user.name}
                              </p>
                              <p className="text-xs text-light-text dark:text-gray-400">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-light-text dark:text-gray-400">
                            <div className="flex items-center mb-1">
                              <Mail size={14} className="mr-2" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone size={14} className="mr-2" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'agent' ? (
                            editingCommissionId === user.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={commissionDraft}
                                  onChange={(e) => setCommissionDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditCommission(user.id);
                                    if (e.key === 'Escape') cancelEditCommission();
                                  }}
                                  autoFocus
                                  className="w-20 px-2 py-1 text-xs border border-soft-green rounded focus:outline-none focus:ring-1 focus:ring-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                                  disabled={savingCommission}
                                />
                                <button
                                  onClick={() => saveEditCommission(user.id)}
                                  disabled={savingCommission}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                  title="Save"
                                >
                                  {savingCommission ? <Loader className="animate-spin" size={14} /> : <Check size={14} />}
                                </button>
                                <button
                                  onClick={cancelEditCommission}
                                  disabled={savingCommission}
                                  className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditCommission(user)}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 w-fit hover:bg-emerald-200 dark:hover:bg-emerald-800 transition group"
                                title="Click to edit"
                              >
                                <Percent size={12} />
                                {user.commission_rate || 5}%
                                <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition" />
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-light-text dark:text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-light-text dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Delete"
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 size={18} />
                            </button>
                            <select
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              value=""
                              className="text-xs border border-pastel-green dark:border-gray-600 rounded px-1 py-1 focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="">Change Role</option>
                              <option value="broker">Broker</option>
                              <option value="agent">Agent</option>
                              <option value="client">Client</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-pastel-green dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-light-text dark:text-gray-400">
                  Showing {users.length} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-pastel-orange transition text-dark-text dark:text-white"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-dark-text dark:text-white">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-pastel-orange transition text-dark-text dark:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add User Modal */}
          <AddUserModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddUser}
            brokers={brokers}
          />

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-text dark:text-white">Delete User</h3>
                </div>
                <p className="text-light-text dark:text-gray-400 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-dark-text dark:text-white">{userToDelete?.name}</span>? 
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
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserManagement;