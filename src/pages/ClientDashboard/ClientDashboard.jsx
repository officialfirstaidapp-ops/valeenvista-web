import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Clock,
  Loader,
  MapPin,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Briefcase,
  Star,
  Camera,
  Trash2,
  AlertCircle,
  Video,
  DollarSign,
  History,
  CreditCard
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { userAPI, reservationAPI } from '../../services/api';

const ClientDashboard = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = location.state?.activeTab || 'reservations';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, completed: 0, cancelled: 0
  });

  const [cancelModal, setCancelModal] = useState({ open: false, reservation: null });
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [startingCall, setStartingCall] = useState(null);

  // ✅ Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReservation, setPaymentReservation] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    fetchData();
    setFormData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
  }, [user]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5000${avatarPath}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const reservationsRes = await reservationAPI.getMyReservations();
      const list = reservationsRes.data.reservations || [];
      setReservations(list);

      setStats({
        total: list.length,
        pending: list.filter(r => r.status === 'pending').length,
        approved: list.filter(r => r.status === 'approved').length,
        completed: list.filter(r => r.status === 'completed').length,
        cancelled: list.filter(r => r.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      updateUser({ ...user, name: updatedUser.name, phone: updatedUser.phone });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setUpdateMessage('❌ Failed to update profile');
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
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage('❌ Image size must be less than 5MB');
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage('');
    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const response = await userAPI.uploadAvatar(user.id, fd);
      setAvatarMessage('✅ Profile picture updated successfully!');
      const updatedUser = response.data.user;
      updateUser({ ...user, avatar: updatedUser.avatar });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setAvatarMessage('❌ Failed to upload profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const openCancelModal = (reservation) => {
    setCancelModal({ open: true, reservation });
    setErrorMessage('');
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, reservation: null });
  };

  const handleCancelReservation = async () => {
    const reservation = cancelModal.reservation;
    if (!reservation) return;

    setCancelling(true);
    setErrorMessage('');

    try {
      await reservationAPI.cancelReservation(reservation.id);
      setSuccessMessage(`Reservation for "${reservation.property_title}" has been cancelled.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      closeCancelModal();
      await fetchData();
    } catch (error) {
      console.error('Cancel error:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const handleStartVideoCall = async (reservation) => {
    setStartingCall(reservation.id);
    try {
      const response = await reservationAPI.getVideoRoom(reservation.id);
      navigate(`/video-call/${response.data.roomName}`);
    } catch (error) {
      console.error('Failed to start video call:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to start video call');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setStartingCall(null);
    }
  };

  // ✅ Payment modal functions
  const openPaymentModal = async (reservation) => {
    setPaymentReservation(reservation);
    setShowPaymentModal(true);
    setLoadingPayments(true);
    try {
      const response = await reservationAPI.getPayments(reservation.id);
      setPaymentHistory(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPaymentHistory([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentReservation(null);
    setPaymentHistory([]);
  };

  const getReservationStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'partial':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  const getRemainingBalance = (reservation) => {
    const price = parseFloat(reservation.property_price || 0);
    const paid = parseFloat(reservation.total_paid || 0);
    return price - paid;
  };

  const canCancel = (reservation) =>
    ['pending', 'approved'].includes(reservation.status);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar userRole="client" />
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
      <Sidebar userRole="client" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-white/80 mt-1">Welcome back! 👋</p>
              </div>
              <Link
                to="/properties"
                className="bg-white/20 text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition flex items-center gap-2 backdrop-blur-sm"
              >
                <Home size={18} />
                Browse Properties
              </Link>
            </div>
          </div>

          {/* Banners */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-green dark:bg-emerald-900/30 p-3 rounded-lg">
                  <CalendarDays className="text-soft-green" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-orange dark:bg-amber-900/30 p-3 rounded-lg">
                  <ClockIcon className="text-warm-orange" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-green dark:bg-emerald-900/30 p-3 rounded-lg">
                  <CheckCircle className="text-soft-green" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.approved}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="bg-pastel-yellow dark:bg-yellow-900/30 p-3 rounded-lg">
                  <Star className="text-warm-orange" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <XCircle className="text-gray-500" size={24} />
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400 text-sm">Cancelled</p>
                  <p className="text-2xl font-bold text-dark-text dark:text-white">{stats.cancelled}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-pastel-green dark:border-gray-700">
            {['reservations', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-soft-green border-b-2 border-soft-green'
                    : 'text-light-text dark:text-gray-400 hover:text-soft-green'
                }`}
              >
                {tab === 'reservations' ? 'My Reservations' : 'Profile'}
              </button>
            ))}
          </div>

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <div>
              <h2 className="text-xl font-semibold text-dark-text dark:text-white mb-4">
                My Viewing Reservations
              </h2>
              {reservations.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-pastel-green dark:border-gray-700">
                  <Calendar size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
                  <p className="text-light-text dark:text-gray-400">No reservations yet</p>
                  <Link
                    to="/properties"
                    className="mt-4 inline-block px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
                  >
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-pastel-green dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark-text dark:text-white">
                            {reservation.property_title}
                          </h3>
                          {reservation.property_location && (
                            <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin size={14} />
                              {reservation.property_location}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(reservation.reservation_date)}
                            </p>
                            <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1">
                              <Clock size={14} />
                              {reservation.reservation_time}
                            </p>
                          </div>
                          {reservation.notes && (
                            <p className="text-sm text-light-text dark:text-gray-400 mt-2">
                              📝 {reservation.notes}
                            </p>
                          )}
                          {reservation.price && (
                            <p className="text-sm font-semibold text-soft-green mt-2">
                              Price: {formatPrice(reservation.price)}
                            </p>
                          )}

                          {/* ✅ Payment status (only for completed) */}
                          {reservation.status === 'completed' && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusBadge(reservation.payment_status)}`}>
                                💰 {reservation.payment_status || 'unpaid'}
                              </span>
                              <span className="text-xs text-light-text dark:text-gray-400">
                                Paid: <span className="font-semibold text-emerald-600">{formatPrice(reservation.total_paid)}</span>
                                {' · '}
                                Balance: <span className="font-semibold text-rose-600">{formatPrice(getRemainingBalance(reservation))}</span>
                              </span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${getReservationStatusBadge(
                            reservation.status
                          )}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-pastel-green dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
                        <Link
                          to={`/property/${reservation.property_id}`}
                          className="text-sm text-soft-green hover:text-warm-orange transition flex items-center gap-1"
                        >
                          View Property Details
                          <ChevronRight size={16} />
                        </Link>

                        <div className="flex gap-2 flex-wrap">
                          {/* ✅ Payment History button (completed only) */}
                          {reservation.status === 'completed' && (
                            <button
                              onClick={() => openPaymentModal(reservation)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                            >
                              <History size={14} />
                              Payment History
                            </button>
                          )}

                          {reservation.status === 'approved' && (
                            <button
                              onClick={() => handleStartVideoCall(reservation)}
                              disabled={startingCall === reservation.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50"
                            >
                              {startingCall === reservation.id ? (
                                <Loader className="animate-spin" size={14} />
                              ) : (
                                <Video size={14} />
                              )}
                              {startingCall === reservation.id ? 'Starting...' : 'Join Video Call'}
                            </button>
                          )}

                          {canCancel(reservation) && (
                            <button
                              onClick={() => openCancelModal(reservation)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition"
                            >
                              <Trash2 size={14} />
                              Cancel Reservation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 text-center">
                  <div className="relative inline-block">
                    {getAvatarUrl(user?.avatar) ? (
                      <img
                        src={getAvatarUrl(user?.avatar)}
                        alt={user?.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-soft-green to-warm-orange flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-md">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-soft-green rounded-full flex items-center justify-center cursor-pointer hover:bg-warm-orange transition shadow-md border-2 border-white dark:border-gray-800">
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

                  {avatarMessage && (
                    <div
                      className={`mt-3 text-sm ${
                        avatarMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {avatarMessage}
                    </div>
                  )}
                  {avatarLoading && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-soft-green">
                      <Loader className="animate-spin" size={16} />
                      Uploading...
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-dark-text dark:text-white mt-4">
                    {user?.name}
                  </h2>
                  <p className="text-sm text-light-text dark:text-gray-400 capitalize flex items-center justify-center gap-1">
                    <Briefcase size={14} />
                    {user?.role}
                  </p>
                  <div className="mt-4 pt-4 border-t border-pastel-green dark:border-gray-700">
                    <p className="text-sm text-dark-text dark:text-white flex items-center justify-center gap-2">
                      <Mail size={16} className="text-light-text dark:text-gray-400" />
                      {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-sm text-dark-text dark:text-white flex items-center justify-center gap-2 mt-2">
                        <Phone size={16} className="text-light-text dark:text-gray-400" />
                        {user?.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-pastel-green dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div>
                        <p className="text-light-text dark:text-gray-400">Member Since</p>
                        <p className="font-medium text-dark-text dark:text-white">
                          {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-pastel-green dark:bg-gray-700"></div>
                      <div>
                        <p className="text-light-text dark:text-gray-400">Reservations</p>
                        <p className="font-medium text-dark-text dark:text-white">
                          {reservations.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-dark-text dark:text-white">
                        Profile Information
                      </h3>
                      <p className="text-sm text-light-text dark:text-gray-400">
                        Update your personal details
                      </p>
                    </div>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-pastel-green text-soft-green rounded-lg hover:bg-soft-green hover:text-white transition font-medium"
                      >
                        <Edit2 size={16} />
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    )}
                  </div>

                  {updateMessage && (
                    <div
                      className={`p-3 rounded-lg mb-4 ${
                        updateMessage.includes('success')
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {updateMessage}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green text-dark-text dark:text-white ${
                          !editing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500"
                      />
                      <p className="text-xs text-light-text dark:text-gray-400 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green text-dark-text dark:text-white ${
                          !editing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {editing && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={updateLoading}
                          className="flex items-center gap-2 px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium disabled:opacity-50"
                        >
                          {updateLoading ? (
                            <Loader className="animate-spin" size={18} />
                          ) : (
                            <Save size={18} />
                          )}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && cancelModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-dark-text dark:text-white">
                Cancel Reservation?
              </h3>
            </div>
            <p className="text-light-text dark:text-gray-400 mb-2">
              You are about to cancel your viewing reservation for:
            </p>
            <p className="font-semibold text-dark-text dark:text-white mb-4">
              {cancelModal.reservation.property_title}
            </p>
            <p className="text-sm text-light-text dark:text-gray-400 mb-6">
              The agent will be notified. This action cannot be undone.
            </p>

            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                disabled={cancelling}
                className="px-4 py-2 text-light-text dark:text-gray-400 hover:bg-pastel-orange dark:hover:bg-gray-700 rounded-lg transition"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={cancelling}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Payment History Modal */}
      {showPaymentModal && paymentReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white flex items-center gap-2">
                <CreditCard size={24} className="text-emerald-500" />
                Payment History
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-light-text dark:text-gray-400">Property:</p>
                  <p className="font-medium text-dark-text dark:text-white">{paymentReservation.property_title}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Agent:</p>
                  <p className="font-medium text-dark-text dark:text-white">{paymentReservation.agent_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Total Price:</p>
                  <p className="font-semibold text-soft-green text-lg">{formatPrice(paymentReservation.property_price)}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Total Paid:</p>
                  <p className="font-semibold text-emerald-600 text-lg">{formatPrice(paymentReservation.total_paid)}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Remaining Balance:</p>
                  <p className="font-semibold text-rose-600 text-lg">{formatPrice(getRemainingBalance(paymentReservation))}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Status:</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusBadge(paymentReservation.payment_status)}`}>
                    {paymentReservation.payment_status || 'unpaid'}
                  </span>
                </div>
              </div>
            </div>

            {/* History List */}
            {loadingPayments ? (
              <div className="text-center py-6">
                <Loader className="animate-spin text-soft-green mx-auto" size={32} />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-6 text-light-text dark:text-gray-400">
                <History size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-text dark:text-white">
                          {formatPrice(payment.amount)}
                        </p>
                        <p className="text-xs text-light-text dark:text-gray-400">
                          {formatDate(payment.created_at)} • {payment.payment_method?.replace('_', ' ')}
                          {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-light-text dark:text-gray-400 italic mt-1">
                            "{payment.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;