import React, { useState } from 'react';
import { X, Calendar, Clock, User, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { reservationAPI } from '../services/api';

const ReservationModal = ({ isOpen, onClose, property, onSuccess }) => {
  const [formData, setFormData] = useState({
    reservation_date: '',
    reservation_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ✅ Inline field errors
  const [fieldErrors, setFieldErrors] = useState({ date: '', time: '' });

  // ✅ Track current time for live validation
  const [now, setNow] = useState(new Date());

  // Update `now` every 30s so validation stays accurate
  React.useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear that field's error as the user changes it
    if (name === 'reservation_date') setFieldErrors(prev => ({ ...prev, date: '' }));
    if (name === 'reservation_time') setFieldErrors(prev => ({ ...prev, time: '' }));
  };

  // ✅ Validate date & time
  const validateDateTime = () => {
    const errors = { date: '', time: '' };
    const { reservation_date, reservation_time } = formData;

    if (!reservation_date) {
      errors.date = 'Please choose a date';
    }
    if (!reservation_time) {
      errors.time = 'Please choose a time';
    }

    // If both are set, check the combined datetime
    if (reservation_date && reservation_time) {
      const [y, m, d] = reservation_date.split('-').map(Number);
      const [h, min] = reservation_time.split(':').map(Number);

      const chosen = new Date(y, m - 1, d, h, min, 0, 0);

      if (chosen.getTime() <= now.getTime()) {
        // Same day? Show a time-specific error
        const isToday =
          y === now.getFullYear() &&
          m - 1 === now.getMonth() &&
          d === now.getDate();

        if (isToday) {
          errors.time = 'Please choose a future time (after now)';
        } else {
          errors.date = 'Date and time cannot be in the past';
        }
      }
    }

    setFieldErrors(errors);
    return !errors.date && !errors.time;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Block submit if invalid
    if (!validateDateTime()) {
      return;
    }

    setLoading(true);

    try {
      const data = {
        property_id: property.id,
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        notes: formData.notes
      };

      await reservationAPI.create(data);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.response?.data?.error || 'Failed to schedule viewing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Today's date string (for the `min` attribute)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const hasErrors = Boolean(fieldErrors.date || fieldErrors.time);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-dark-text dark:text-white">Schedule Viewing</h3>
          <button
            onClick={onClose}
            className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white transition"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Property Info */}
        <div className="bg-pastel-green/20 dark:bg-emerald-900/20 rounded-lg p-4 mb-4 border border-pastel-green dark:border-emerald-800">
          <p className="text-sm text-light-text dark:text-gray-400">Property</p>
          <p className="font-semibold text-dark-text dark:text-white">{property?.title}</p>
          <p className="text-sm text-light-text dark:text-gray-400">{property?.location}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle size={18} />
            Viewing scheduled successfully! Redirecting...
          </div>
        )}

        {/* Error Message (backend) */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
              <Calendar size={16} className="inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              name="reservation_date"
              value={formData.reservation_date}
              onChange={handleChange}
              min={todayStr}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white ${
                fieldErrors.date
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-pastel-green dark:border-gray-600 focus:border-soft-green'
              }`}
              required
            />
            {fieldErrors.date && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={12} /> {fieldErrors.date}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
              <Clock size={16} className="inline mr-1" />
              Time *
            </label>
            <select
              name="reservation_time"
              value={formData.reservation_time}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white ${
                fieldErrors.time
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-pastel-green dark:border-gray-600 focus:border-soft-green'
              }`}
              required
            >
              <option value="">Select Time</option>
              <option value="09:00">9:00 AM</option>
              <option value="09:30">9:30 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="12:30">12:30 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="13:30">1:30 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="14:30">2:30 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="15:30">3:30 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="16:30">4:30 PM</option>
              <option value="17:00">5:00 PM</option>
            </select>
            {fieldErrors.time && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={12} /> {fieldErrors.time}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
              <User size={16} className="inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
              placeholder="Any special requests or questions..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-light-text dark:text-gray-400 hover:bg-pastel-orange dark:hover:bg-gray-700 rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <Calendar size={18} />}
              {loading ? 'Scheduling...' : 'Schedule Viewing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;