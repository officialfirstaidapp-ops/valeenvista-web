import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader,
  Shield,
  Briefcase,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getById(id);
      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        email: response.data.email || ''
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setUpdating(true);
    setError(null);
    setSuccessMessage('');

    try {
      await userAPI.update(id, formData);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditing(false);
      fetchUser();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      broker: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800',
      client: 'bg-gray-100 text-gray-800'
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={20} />;
      case 'broker': return <Briefcase size={20} />;
      case 'agent': return <Building2 size={20} />;
      default: return <User size={20} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (error || !user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-pastel-green max-w-md">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-dark-text mb-2">User Not Found</h2>
              <p className="text-light-text">{error || 'The user you\'re looking for doesn\'t exist.'}</p>
              <Link
                to="/admin/users"
                className="mt-4 inline-flex items-center text-soft-green hover:text-warm-orange transition"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to User Management
              </Link>
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
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/admin/users"
              className="inline-flex items-center text-light-text hover:text-soft-green transition"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Users
            </Link>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md border border-pastel-green overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-soft-green to-warm-orange p-6 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold border-2 border-white/30">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getRoleBadge(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                    <span className="text-white/70 text-sm">ID: {user.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-dark-text">Profile Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
                    disabled={user.id === currentUser?.id}
                  >
                    <Edit size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name || '',
                          phone: user.phone || '',
                          email: user.email || ''
                        });
                      }}
                      className="px-4 py-2 text-light-text hover:bg-pastel-orange rounded-lg transition"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50"
                    >
                      {updating ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                    />
                  ) : (
                    <p className="text-dark-text font-medium">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">Email</label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                    />
                  ) : (
                    <p className="text-dark-text font-medium flex items-center gap-2">
                      <Mail size={16} className="text-light-text" />
                      {user.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">Phone Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                    />
                  ) : (
                    <p className="text-dark-text font-medium flex items-center gap-2">
                      <Phone size={16} className="text-light-text" />
                      {user.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">Member Since</label>
                  <p className="text-dark-text font-medium flex items-center gap-2">
                    <Calendar size={16} className="text-light-text" />
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;