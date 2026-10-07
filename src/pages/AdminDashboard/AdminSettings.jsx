import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Moon,
  Sun,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesoIcon from '../../components/PesoIcon';
import { milestoneAPI, settingsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AdminSettings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    commissionRate: 5
  });

  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', trigger_percent: 0, release_percent: 0, sort_order: 0
  });
  const [milestoneError, setMilestoneError] = useState('');
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetchSettings();
    fetchMilestones();
  }, []);

  // ============ SETTINGS ============
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await settingsAPI.get();
      const s = res.data.settings || {};
      setSettings({
        commissionRate: s.default_commission_rate ?? 5
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await settingsAPI.update({
        default_commission_rate: parseFloat(settings.commissionRate)
      });

      const s = res.data.settings || {};
      setSettings({
        commissionRate: s.default_commission_rate ?? settings.commissionRate
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ============ MILESTONES ============
  const fetchMilestones = async () => {
    try {
      setMilestonesLoading(true);
      const response = await milestoneAPI.getAll();
      setMilestones(response.data.milestones || []);
    } catch (err) {
      console.error('Failed to load milestones:', err);
      setMilestoneError('Failed to load milestones');
    } finally {
      setMilestonesLoading(false);
    }
  };

  const validateMilestone = (form) => {
    const errors = {};

    if (!form.name || form.name.trim() === '') {
      errors.name = 'Name is required';
    } else if (form.name.trim().length > 60) {
      errors.name = 'Name is too long (max 60)';
    }

    const trigger = parseFloat(form.trigger_percent);
    if (isNaN(trigger)) {
      errors.trigger_percent = 'Must be a number';
    } else if (trigger < 0 || trigger > 100) {
      errors.trigger_percent = 'Must be 0 – 100';
    }

    const release = parseFloat(form.release_percent);
    if (isNaN(release)) {
      errors.release_percent = 'Must be a number';
    } else if (release < 0 || release > 100) {
      errors.release_percent = 'Must be 0 – 100';
    }

    const order = parseInt(form.sort_order);
    if (isNaN(order) || order < 0) {
      errors.sort_order = 'Must be 0 or more';
    }

    return errors;
  };

  const handleEditClick = (milestone) => {
    setEditingId(milestone.id);
    setEditErrors({});
    setEditForm({
      name: milestone.name,
      trigger_percent: parseFloat(milestone.trigger_percent),
      release_percent: parseFloat(milestone.release_percent),
      sort_order: milestone.sort_order
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
    setMilestoneError('');
  };

  const handleSaveEdit = async () => {
    const errors = validateMilestone(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMilestoneError('Please fix the highlighted fields before saving.');
      return;
    }

    try {
      setMilestoneError('');
      await milestoneAPI.update(editingId, editForm);
      setEditingId(null);
      setEditErrors({});
      await fetchMilestones();
      setSuccess('Milestone updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update failed:', err);
      setMilestoneError(err.response?.data?.error || 'Failed to update milestone');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this milestone? Existing commissions will keep their history.')) {
      return;
    }
    try {
      await milestoneAPI.delete(id);
      await fetchMilestones();
      setSuccess('Milestone deactivated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
      setMilestoneError(err.response?.data?.error || 'Failed to delete milestone');
    }
  };

  const totalRelease = milestones.reduce(
    (sum, m) => sum + parseFloat(m.release_percent || 0),
    0
  );

  const totalReleaseOff = Math.abs(totalRelease - 100) > 0.01;

  const inputClass = (hasError) =>
    `w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 text-dark-text dark:text-white ${
      hasError
        ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
        : 'border-pastel-green dark:border-gray-600'
    }`;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar userRole="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text dark:text-white">Settings</h1>
            <p className="text-light-text dark:text-gray-400 mt-1">Configure system settings and preferences</p>
          </div>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {milestoneError && (
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> {milestoneError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ Appearance Section — Dark Mode Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {darkMode ? (
                  <Moon size={20} className="text-soft-green" />
                ) : (
                  <Sun size={20} className="text-warm-orange" />
                )}
                <h2 className="text-xl font-semibold text-dark-text dark:text-white">Appearance</h2>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-dark-text dark:text-white">
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-sm text-light-text dark:text-gray-400">
                    Switch between light and dark theme
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={20} className="text-soft-green" />
                <h2 className="text-xl font-semibold text-dark-text dark:text-white">General Settings</h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader className="animate-spin text-soft-green" size={28} />
                </div>
              ) : (
                <div className="max-w-md">
                  <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">
                    Default Commission Rate (%)
                  </label>
                  <div className="relative">
                    <PesoIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" />
                    <input
                      type="number"
                      name="commissionRate"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.commissionRate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-light-text dark:text-gray-400 mt-1">
                    Applies to <strong>new agents only</strong>. Existing agents keep their own rate.
                  </p>
                </div>
              )}
            </div>

            {/* Commission Milestones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-pastel-green dark:border-gray-700 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <PesoIcon size={20} className="text-soft-green" />
                <h2 className="text-xl font-semibold text-dark-text dark:text-white">
                  Commission Milestones
                </h2>
              </div>

              <p className="text-sm text-light-text dark:text-gray-400 mb-4">
                These milestones control how agent commissions are released.
                <strong> Trigger %</strong> is the amount the client must have paid.
                <strong> Release %</strong> is how much of the commission is released.
              </p>

              {milestonesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-soft-green" size={32} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pastel-green dark:border-gray-700 text-left text-light-text dark:text-gray-400">
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Trigger %</th>
                        <th className="py-3 px-2">Release %</th>
                        <th className="py-3 px-2">Order</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((m) => (
                        <tr key={m.id} className="border-b border-pastel-green/50 dark:border-gray-700 hover:bg-pastel-green/10 dark:hover:bg-gray-700/50">
                          {editingId === m.id ? (
                            <>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className={inputClass(editErrors.name)}
                                />
                                {editErrors.name && (
                                  <p className="text-xs text-red-500 mt-1">{editErrors.name}</p>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={editForm.trigger_percent}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_percent: e.target.value })}
                                  className={`${inputClass(editErrors.trigger_percent)} w-20`}
                                />
                                {editErrors.trigger_percent && (
                                  <p className="text-xs text-red-500 mt-1">{editErrors.trigger_percent}</p>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={editForm.release_percent}
                                  onChange={(e) => setEditForm({ ...editForm, release_percent: e.target.value })}
                                  className={`${inputClass(editErrors.release_percent)} w-20`}
                                />
                                {editErrors.release_percent && (
                                  <p className="text-xs text-red-500 mt-1">{editErrors.release_percent}</p>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={editForm.sort_order}
                                  onChange={(e) => setEditForm({ ...editForm, sort_order: e.target.value })}
                                  className={`${inputClass(editErrors.sort_order)} w-16`}
                                />
                                {editErrors.sort_order && (
                                  <p className="text-xs text-red-500 mt-1">{editErrors.sort_order}</p>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <button onClick={handleSaveEdit} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Save"><Check size={16} /></button>
                                <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-1" title="Cancel"><X size={16} /></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-2 font-medium text-dark-text dark:text-white">{m.name}</td>
                              <td className="py-3 px-2 text-dark-text dark:text-white">{parseFloat(m.trigger_percent)}%</td>
                              <td className="py-3 px-2 text-dark-text dark:text-white">{parseFloat(m.release_percent)}%</td>
                              <td className="py-3 px-2 text-dark-text dark:text-white">{m.sort_order}</td>
                              <td className="py-3 px-2 text-right">
                                <button onClick={() => handleEditClick(m)} className="p-1.5 text-soft-green hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Edit"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-1" title="Deactivate"><Trash2 size={16} /></button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-pastel-green dark:border-gray-700 flex items-center justify-between text-sm">
                  <span className="text-light-text dark:text-gray-400">Total release percent across active milestones:</span>
                  <span className={`font-bold ${!totalReleaseOff ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                    {totalRelease.toFixed(2)}%
                    {!totalReleaseOff && ' ✅'}
                    {totalReleaseOff && (
                      <span className="block text-xs font-normal text-orange-500 mt-0.5">
                        Should equal 100%
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;