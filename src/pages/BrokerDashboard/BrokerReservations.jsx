import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Loader,
  RefreshCw,
  Award,
  Search,
  XCircle,
  Eye,
  X,
  Check,
  History,
  CreditCard
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { reservationAPI } from '../../services/api';

const BrokerReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 1
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '', payment_method: 'cash', reference_number: '', notes: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [pagination.page, filter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filter !== 'all' ? filter : undefined
      };
      const response = await reservationAPI.getAll(params);
      setReservations(response.data.reservations || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit)
      }));
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = async (reservation) => {
    setSelectedReservation(reservation);
    setShowPaymentModal(true);
    setPaymentData({ amount: '', payment_method: 'cash', reference_number: '', notes: '' });
    setPaymentError('');
    setSuccessMessage('');
    await fetchPaymentHistory(reservation.id);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedReservation(null);
    setPaymentHistory([]);
    setPaymentData({ amount: '', payment_method: 'cash', reference_number: '', notes: '' });
    setPaymentError('');
    setSuccessMessage('');
  };

  const fetchPaymentHistory = async (reservationId) => {
    setLoadingPayments(true);
    try {
      const response = await reservationAPI.getPayments(reservationId);
      setPaymentHistory(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPaymentHistory([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentError('');
    setSuccessMessage('');

    try {
      const response = await reservationAPI.recordPayment(selectedReservation.id, {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes
      });

      setSuccessMessage(response.data.message);
      setPaymentData({ amount: '', payment_method: 'cash', reference_number: '', notes: '' });
      await fetchPaymentHistory(selectedReservation.id);
      await fetchReservations();

      if (response.data.paymentStatus === 'paid') {
        setTimeout(() => { closePaymentModal(); }, 2000);
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setPaymentError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) =>
    `₱${parseFloat(price || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'partial': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'unpaid': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredReservations = reservations.filter(r =>
    r.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRemainingBalance = (reservation) => {
    const price = parseFloat(reservation.property_price || 0);
    const paid = parseFloat(reservation.total_paid || 0);
    return price - paid;
  };

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
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">Reservations</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">View all property viewing requests</p>
            </div>
            <button onClick={fetchReservations} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700">
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by property, client, or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
              />
            </div>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }} className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} /> {error}
              <button onClick={fetchReservations} className="ml-auto text-red-700 hover:text-red-900 underline">Try Again</button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
                <p className="text-light-text dark:text-gray-400">{searchTerm ? 'No reservations match your search' : 'No reservations found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pastel-green/30 dark:bg-emerald-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-text dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pastel-green dark:divide-gray-700">
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4"><p className="font-medium text-dark-text dark:text-white">{reservation.property_title || 'N/A'}</p></td>
                        <td className="px-6 py-4 text-sm text-dark-text dark:text-white">{reservation.client_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-dark-text dark:text-white">{reservation.agent_name || 'N/A'}</td>
                        <td className="px-6 py-4"><p className="text-sm font-semibold text-dark-text dark:text-white">{formatPrice(reservation.property_price)}</p></td>
                        <td className="px-6 py-4">
                          {reservation.status === 'completed' ? (
                            <div className="space-y-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusBadge(reservation.payment_status)}`}>{reservation.payment_status || 'unpaid'}</span>
                              <p className="text-xs text-light-text dark:text-gray-400">{formatPrice(reservation.total_paid)} / {formatPrice(reservation.property_price)}</p>
                            </div>
                          ) : (<span className="text-xs text-gray-400">—</span>)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getReservationStatusBadge(reservation.status)}`}>{reservation.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {reservation.status === 'completed' && (
                            <button onClick={() => openPaymentModal(reservation)} className="flex items-center gap-1 px-3 py-1.5 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition text-sm" title={reservation.payment_status === 'paid' ? 'View Payments' : 'Record Payment'}>
                              {reservation.payment_status === 'paid' ? (<><History size={14} />History</>) : (<><CreditCard size={14} />Payment</>)}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-pastel-green dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-light-text dark:text-gray-400">Showing {filteredReservations.length} of {pagination.total} reservations</p>
                <div className="flex gap-2">
                  <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-pastel-orange dark:hover:bg-gray-700 transition text-dark-text dark:text-white">Previous</button>
                  <span className="px-4 py-2 text-dark-text dark:text-white">Page {pagination.page} of {pagination.totalPages}</span>
                  <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-pastel-orange dark:hover:bg-gray-700 transition text-dark-text dark:text-white">Next</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark-text dark:text-white flex items-center gap-2">
                <CreditCard size={24} className="text-soft-green" />
                {selectedReservation.payment_status === 'paid' ? 'Payment History' : 'Record Payment'}
              </h2>
              <button onClick={closePaymentModal} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-light-text dark:text-gray-400">Property:</p>
                  <p className="font-medium text-dark-text dark:text-white">{selectedReservation.property_title}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Client:</p>
                  <p className="font-medium text-dark-text dark:text-white">{selectedReservation.client_name}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Total Price:</p>
                  <p className="font-semibold text-soft-green text-lg">{formatPrice(selectedReservation.property_price)}</p>
                </div>
                <div>
                  <p className="text-light-text dark:text-gray-400">Remaining Balance:</p>
                  <p className="font-semibold text-rose-600 text-lg">{formatPrice(getRemainingBalance(selectedReservation))}</p>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="bg-emerald-100 border border-emerald-400 text-emerald-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <Check size={18} />{successMessage}
              </div>
            )}

            {paymentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <XCircle size={18} />{paymentError}
              </div>
            )}

            {selectedReservation.payment_status !== 'paid' && (
              <form onSubmit={handlePaymentSubmit} className="mb-6">
                <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-3">Add New Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Amount (₱) *</label>
                    <input type="number" min="1" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white" placeholder="Enter amount" required />
                  </div>
                  <div>
                    <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Payment Method</label>
                    <select value={paymentData.payment_method} onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })} className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="gcash">GCash</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Reference Number (Optional)</label>
                    <input type="text" value={paymentData.reference_number} onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })} className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white" placeholder="e.g., transaction ID" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Notes (Optional)</label>
                    <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows="2" className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white resize-none" placeholder="Any additional notes..." />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium disabled:opacity-50">
                    {submitting ? <Loader className="animate-spin" size={18} /> : <PesoIcon size={18} />}
                    {submitting ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            )}

            <div>
              <h3 className="text-lg font-semibold text-dark-text dark:text-white mb-3">Payment History</h3>
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
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={closePaymentModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerReservations;