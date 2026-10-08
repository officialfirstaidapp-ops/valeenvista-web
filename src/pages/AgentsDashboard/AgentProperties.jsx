import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Loader,
  MapPin,
  RefreshCw,
  Search,
  X,
  XCircle,
  Save
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { propertyAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AgentProperties = () => {
  const { formatPrice } = useTheme();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyAPI.getMyProperties();
      setProperties(response.data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await propertyAPI.update(editingProperty.id, editingProperty);
      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      console.error('Error updating property:', err);
      alert('Failed to update property');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await propertyAPI.delete(propertyToDelete.id);
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      fetchProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `https://valeenvista-backend.onrender.com${imagePath}`;
    return `https://valeenvista-backend.onrender.com/uploads/properties/${imagePath}`;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProperties = properties.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text dark:text-white">My Properties</h1>
              <p className="text-light-text dark:text-gray-400 mt-1">Manage your assigned properties</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/add-property"
                className="flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
              >
                <Plus size={18} />
                Add Property
              </Link>
              <button
                onClick={fetchProperties}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-700"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-pastel-green dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search properties by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} />
              {error}
              <button onClick={fetchProperties} className="ml-auto text-red-700 hover:text-red-900 underline">
                Try Again
              </button>
            </div>
          )}

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-pastel-green dark:border-gray-700">
              <Home size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
              <p className="text-light-text dark:text-gray-400">
                {searchTerm ? 'No properties match your search' : 'No properties assigned yet'}
              </p>
              {!searchTerm && (
                <Link
                  to="/add-property"
                  className="mt-4 inline-block px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
                >
                  Add Your First Property
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-pastel-green dark:border-gray-700 hover:shadow-lg transition">
                  <div className="relative h-48">
                    <img
                      src={getImageUrl(property.images?.[0])}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(property.status)}`}>
                      {property.status}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-dark-text dark:text-white truncate">{property.title}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingProperty(property)}
                          className="text-light-text dark:text-gray-400 hover:text-soft-green transition p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setPropertyToDelete(property);
                            setShowDeleteModal(true);
                          }}
                          className="text-light-text dark:text-gray-400 hover:text-red-500 transition p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-light-text dark:text-gray-400 mb-2">
                      <MapPin size={14} className="mr-1 flex-shrink-0" />
                      <span className="text-sm truncate">{property.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-soft-green font-bold text-lg">{formatPrice(property.price)}</span>
                      <span className="text-xs text-light-text dark:text-gray-400">{property.bedrooms || 0} beds · {property.bathrooms || 0} baths</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link
                        to={`/property/${property.id}`}
                        className="flex-1 bg-soft-green text-white py-2 rounded-lg hover:bg-warm-orange transition text-center text-sm"
                      >
                        <Eye size={16} className="inline mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => setEditingProperty(property)}
                        className="flex-1 border border-soft-green text-soft-green py-2 rounded-lg hover:bg-pastel-green transition text-center text-sm"
                      >
                        <Edit size={16} className="inline mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Property Modal */}
          {editingProperty && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-dark-text dark:text-white">Edit Property</h3>
                  <button onClick={() => setEditingProperty(null)} className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleUpdateProperty}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Title</label>
                      <input
                        type="text"
                        value={editingProperty.title || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Description</label>
                      <textarea
                        value={editingProperty.description || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Price</label>
                      <input
                        type="number"
                        value={editingProperty.price || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, price: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Location</label>
                      <input
                        type="text"
                        value={editingProperty.location || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Bedrooms</label>
                      <input
                        type="number"
                        value={editingProperty.bedrooms || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Bathrooms</label>
                      <input
                        type="number"
                        value={editingProperty.bathrooms || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Area (sqm)</label>
                      <input
                        type="text"
                        value={editingProperty.area || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, area: e.target.value })}
                        placeholder="e.g., 85 sqm"
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text dark:text-white text-sm font-bold mb-2">Status</label>
                      <select
                        value={editingProperty.status || 'available'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, status: e.target.value })}
                        className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setEditingProperty(null)}
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
          {showDeleteModal && propertyToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-pastel-green dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-text dark:text-white">Delete Property</h3>
                </div>
                <p className="text-light-text dark:text-gray-400 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-dark-text dark:text-white">{propertyToDelete.title}</span>? 
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
                    onClick={handleDeleteProperty}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete Property
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

export default AgentProperties;