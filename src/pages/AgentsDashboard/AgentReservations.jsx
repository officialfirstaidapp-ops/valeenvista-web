import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  Filter,
  Award,
  Upload,
  Image,
  Trash2,
  Eye,
  X,
  FileText,
  Video,
  History
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { reservationAPI } from '../../services/api';
import api from '../../services/api';

const AgentReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [processingReservation, setProcessingReservation] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [startingCall, setStartingCall] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReservation, setPaymentReservation] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reservationAPI.getAgentReservations();
      setReservations(response.data.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationStatus = async (reservationId, status) => {
    // ✅ Confirm for cancel
    if (status === 'cancelled') {
      if (!window.confirm('Cancel this reservation? The client will be notified.')) {
        return;
      }
    }

    setProcessingReservation(reservationId);
    try {
      await reservationAPI.updateStatus(reservationId, { status });
      await fetchReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert(err.response?.data?.error || 'Failed to update reservation');
    } finally {
      setProcessingReservation(null);
    }
  };

  const handleStartVideoCall = async (reservation) => {
    setStartingCall(reservation.id);
    try {
      const response = await reservationAPI.getVideoRoom(reservation.id);
      navigate(`/video-call/${response.data.roomName}`);
    } catch (err) {
      console.error('Failed to start video call:', err);
      alert(err.response?.data?.error || 'Failed to start video call');
    } finally {
      setStartingCall(null);
    }
  };

  const handleFileUpload = async (reservationId, files) => {
    setUploading(reservationId);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await api.post(`/reservations/${reservationId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      alert('✅ Files uploaded successfully!');
      await fetchReservations();

      if (showProofModal && selectedReservation?.id === reservationId) {
        await fetchAttachments(reservationId);
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('❌ Failed to upload files: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const fetchAttachments = async (reservationId) => {
    setLoadingAttachments(true);
    try {
      const response = await api.get(`/reservations/${reservationId}/attachments`);
      setAttachments(response.data.attachments || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/reservations/attachments/${attachmentId}`);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
      alert('✅ File deleted successfully!');
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert('❌ Failed to delete file');
    }
  };

  const openProofModal = async (reservation) => {
    setSelectedReservation(reservation);
    setShowProofModal(true);
    await fetchAttachments(reservation.id);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setSelectedReservation(null);
    setAttachments([]);
  };

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

  const formatPrice = (price) =>
    `₱${parseFloat(price || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getRemainingBalance = (reservation) => {
    const price = parseFloat(reservation.property_price || 0);
    const paid = parseFloat(reservation.total_paid || 0);
    return price - paid;
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'partial': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'unpaid': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch { return timeString; }
  };

  const getReservationStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getFilteredReservations = () => {
    if (filter === 'all') return reservations;
    return reservations.filter(r => r.status === filter);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const filteredReservations = getFilteredReservations();

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
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Reservations</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">
                {reservations.length} total requests · {pendingCount} pending
              </p>
            </div>
            <button onClick={fetchReservations} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700">
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-pastel-green dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-light-text dark:text-gray-400" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span className="text-sm text-light-text dark:text-gray-400">Showing {filteredReservations.length} reservations</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
              <button onClick={fetchReservations} className="ml-auto text-red-700 hover:text-red-900 underline">Try Again</button>
            </div>
          )}

          {filteredReservations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-pastel-green dark:border-gray-700">
              <Calendar size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
              <p className="text-light-text dark:text-gray-400">
                {filter !== 'all' ? `No ${filter} reservations found` : 'No reservations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-pastel-green dark:border-gray-700 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-dark-text dark:text-white">{reservation.property_title || 'Property'}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getReservationStatusBadge(reservation.status)}`}>{reservation.status}</span>
                        {reservation.status === 'completed' && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusBadge(reservation.payment_status)}`}>
                            💰 {reservation.payment_status || 'unpaid'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1"><User size={14} className="text-soft-green" />Client: {reservation.client_name || 'Unknown'}</p>
                        <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1"><Calendar size={14} className="text-soft-green" />{formatDate(reservation.reservation_date)}</p>
                        <p className="text-sm text-light-text dark:text-gray-400 flex items-center gap-1"><Clock size={14} className="text-soft-green" />{formatTime(reservation.reservation_time)}</p>
                      </div>
                      {reservation.completed_at && (
                        <p className="text-sm text-green-600 flex items-center gap-1 mt-1"><Award size={14} />Completed: {formatDate(reservation.completed_at)}</p>
                      )}
                      {reservation.status === 'completed' && reservation.property_price && (
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                          <span className="text-light-text dark:text-gray-400">Price: <span className="font-semibold text-dark-text dark:text-white">{formatPrice(reservation.property_price)}</span></span>
                          <span className="text-light-text dark:text-gray-400">Paid: <span className="font-semibold text-emerald-600">{formatPrice(reservation.total_paid)}</span></span>
                          <span className="text-light-text dark:text-gray-400">Balance: <span className="font-semibold text-rose-600">{formatPrice(getRemainingBalance(reservation))}</span></span>
                        </div>
                      )}
                      {reservation.notes && (
                        <p className="text-sm text-light-text dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600">📝 {reservation.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {reservation.status === 'pending' && (
                        <>
                          <button onClick={() => handleReservationStatus(reservation.id, 'approved')} disabled={processingReservation === reservation.id} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50">
                            {processingReservation === reservation.id ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            Approve
                          </button>
                          <button onClick={() => handleReservationStatus(reservation.id, 'rejected')} disabled={processingReservation === reservation.id} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50">
                            {processingReservation === reservation.id ? <Loader className="animate-spin" size={16} /> : <XCircle size={16} />}
                            Reject
                          </button>
                        </>
                      )}

                      {reservation.status === 'approved' && (
                        <>
                          <button onClick={() => handleStartVideoCall(reservation)} disabled={startingCall === reservation.id} className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 disabled:opacity-50">
                            {startingCall === reservation.id ? <Loader className="animate-spin" size={16} /> : <Video size={16} />}
                            {startingCall === reservation.id ? 'Starting...' : 'Video Call'}
                          </button>
                          <button onClick={() => handleReservationStatus(reservation.id, 'completed')} disabled={processingReservation === reservation.id} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50">
                            {processingReservation === reservation.id ? <Loader className="animate-spin" size={16} /> : <Award size={16} />}
                            Complete
                          </button>
                          {/* ✅ NEW: Cancel (client no-show) */}
                          <button onClick={() => handleReservationStatus(reservation.id, 'cancelled')} disabled={processingReservation === reservation.id} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50">
                            {processingReservation === reservation.id ? <Loader className="animate-spin" size={16} /> : <XCircle size={16} />}
                            Cancel
                          </button>
                        </>
                      )}

                      {reservation.status === 'completed' && (
                        <>
                          <button onClick={() => openProofModal(reservation)} className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2">
                            <Upload size={16} />Proof
                          </button>
                          {reservation.payment_status && reservation.payment_status !== 'unpaid' && (
                            <button onClick={() => openPaymentModal(reservation)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition flex items-center gap-2">
                              <History size={16} />Payments
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Proof Upload Modal */}
      {showProofModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white">Proof of Transaction</h2>
              <button onClick={closeProofModal} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"><X size={20} /></button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-light-text dark:text-gray-400">Property: <span className="font-medium text-dark-text dark:text-white">{selectedReservation.property_title}</span></p>
              <p className="text-sm text-light-text dark:text-gray-400">Client: <span className="font-medium text-dark-text dark:text-white">{selectedReservation.client_name}</span></p>
              <p className="text-sm text-light-text dark:text-gray-400">Completed: <span className="font-medium text-dark-text dark:text-white">{formatDate(selectedReservation.completed_at)}</span></p>
            </div>

            <div className="border-2 border-dashed border-pastel-green dark:border-gray-600 rounded-lg p-6 mb-4 text-center">
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => { if (e.target.files.length > 0) { handleFileUpload(selectedReservation.id, e.target.files); } }} className="hidden" id="file-upload" disabled={uploading === selectedReservation.id} />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={40} className="text-soft-green" />
                <p className="text-sm text-dark-text dark:text-white font-medium">Click to upload proof files</p>
                <p className="text-xs text-light-text dark:text-gray-400">Images, PDF, or Documents (Max 5 files)</p>
                {uploading === selectedReservation.id && (
                  <div className="w-full max-w-xs mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-soft-green h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-light-text dark:text-gray-400 mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </label>
            </div>

            {loadingAttachments ? (
              <div className="text-center py-8"><Loader className="animate-spin text-soft-green mx-auto" size={32} /></div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 text-light-text dark:text-gray-400">
                <Image size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No proof files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {getFileIcon(attachment.file_type)}
                      <div>
                        <p className="text-sm font-medium text-dark-text dark:text-white">{attachment.filename}</p>
                        <p className="text-xs text-light-text dark:text-gray-400">Uploaded: {formatDate(attachment.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`http://localhost:5000${attachment.filepath}`} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-500 hover:text-blue-700 transition"><Eye size={18} /></a>
                      <button onClick={() => handleDeleteAttachment(attachment.id)} className="p-1 text-red-500 hover:text-red-700 transition"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={closeProofModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentModal && paymentReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white flex items-center gap-2">
                <History size={24} className="text-soft-green" />Payment History
              </h2>
              <button onClick={closePaymentModal} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-light-text dark:text-gray-400">Property:</p>
                  <p className="font-medium text-dark-text dark:text-white">{paymentReservation.property_title}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Client:</p>
                  <p className="font-medium text-dark-text dark:text-white">{paymentReservation.client_name}</p>
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
                  <p className="text-light-text dark:text-gray-400">Payment Status:</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusBadge(paymentReservation.payment_status)}`}>{paymentReservation.payment_status}</span>
                </div>
              </div>
            </div>

            {loadingPayments ? (
              <div className="text-center py-6"><Loader className="animate-spin text-soft-green mx-auto" size={32} /></div>
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
                        <PesoIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-text dark:text-white">{formatPrice(payment.amount)}</p>
                        <p className="text-xs text-light-text dark:text-gray-400">
                          {formatDate(payment.created_at)} • {payment.payment_method?.replace('_', ' ')}
                          {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={closePaymentModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentReservations;