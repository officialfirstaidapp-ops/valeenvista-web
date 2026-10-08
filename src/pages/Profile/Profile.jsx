import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, Camera, Loader, Briefcase, Shield } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `https://valeenvista-backend.onrender.com${avatarPath}`;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateMessage('');

    try {
      const response = await userAPI.update(user.id, formData);
      setUpdateMessage('✅ Profile updated successfully!');
      setEditing(false);
      
      const updatedUser = response.data.user;
      updateUser({ ...user, name: updatedUser.name, phone: updatedUser.phone, bio: updatedUser.bio });
      
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (error) {
      setUpdateMessage('❌ Failed to update profile');
      setTimeout(() => setUpdateMessage(''), 3000);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarMessage('❌ Please upload a valid image (JPEG, PNG, GIF, or WEBP)');
      setTimeout(() => setAvatarMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage('❌ Image size must be less than 5MB');
      setTimeout(() => setAvatarMessage(''), 3000);
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await userAPI.uploadAvatar(user.id, formData);
      setAvatarMessage('✅ Profile picture updated successfully!');
      
      const updatedUser = response.data.user;
      updateUser({ ...user, avatar: updatedUser.avatar });
      
      setTimeout(() => setAvatarMessage(''), 3000);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setAvatarMessage('❌ Failed to upload profile picture');
      setTimeout(() => setAvatarMessage(''), 3000);
    } finally {
      setAvatarLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={14} className="text-purple-500" />;
      case 'broker': return <Briefcase size={14} className="text-blue-500" />;
      case 'agent': return <User size={14} className="text-green-500" />;
      default: return <User size={14} className="text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'broker': return 'bg-blue-100 text-blue-700';
      case 'agent': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSidebarRole = () => {
    if (!user) return 'client';
    switch(user.role) {
      case 'admin': return 'admin';
      case 'broker': return 'broker';
      case 'agent': return 'agent';
      case 'client': return 'client';
      default: return 'client';
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={getSidebarRole()} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text">My Profile</h1>
            <p className="text-light-text mt-1">View and manage your personal information</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green max-w-3xl">
            {/* Avatar and Name Section */}
            <div className="flex items-center gap-6 mb-6 border-b border-pastel-green pb-6">
              <div className="relative">
                {getAvatarUrl(user?.avatar) ? (
                  <img
                    src={getAvatarUrl(user?.avatar)}
                    alt={user?.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-soft-green"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-soft-green to-warm-orange flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-soft-green rounded-full flex items-center justify-center cursor-pointer hover:bg-warm-orange transition shadow-md border-2 border-white">
                  <Camera size={14} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarLoading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-dark-text">{user?.name || 'User'}</h2>
                <p className="text-light-text">{user?.email || 'user@example.com'}</p>
                <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full capitalize ${getRoleColor(user?.role)}`}>
                  {getRoleIcon(user?.role)} {user?.role || 'User'}
                </span>
              </div>
            </div>

            {avatarMessage && (
              <div className={`mb-4 text-sm ${avatarMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {avatarMessage}
              </div>
            )}

            {avatarLoading && (
              <div className="mb-4 flex items-center gap-2 text-sm text-soft-green">
                <Loader className="animate-spin" size={16} />
                Uploading...
              </div>
            )}

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={18} className="text-soft-green flex-shrink-0" />
                <div>
                  <p className="text-xs text-light-text">Email Address</p>
                  <p className="text-sm font-medium text-dark-text">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              {editing ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg col-span-2">
                  <Phone size={18} className="text-soft-green flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-light-text">Phone Number</p>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-1 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={18} className="text-soft-green flex-shrink-0" />
                  <div>
                    <p className="text-xs text-light-text">Phone Number</p>
                    <p className="text-sm font-medium text-dark-text">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-soft-green flex-shrink-0" />
                <div>
                  <p className="text-xs text-light-text">Member Since</p>
                  <p className="text-sm font-medium text-dark-text">
                    {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {editing ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-dark-text mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green text-sm"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            ) : (
              user?.bio && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-light-text">Bio</p>
                  <p className="text-sm font-medium text-dark-text">{user?.bio}</p>
                </div>
              )
            )}

            {/* Update Message */}
            {updateMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                updateMessage.includes('success') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {updateMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        bio: user?.bio || ''
                      });
                      setUpdateMessage('');
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateLoading}
                    className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;