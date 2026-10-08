import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Search,
  Edit,
  Trash2,
  Eye,
  Plus,
  Loader,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  X,
  Check,
  AlertCircle,
  User,
  UserPlus,
  Briefcase
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { propertyAPI, userAPI } from '../../services/api';

const BrokerProperties = () => {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingProperty, setEditingProperty] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProperty, setAssignProperty] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://valeenvista-backend.onrender.com${imagePath}`;
  };

  useEffect(() => {
    fetchProperties();
    fetchAgents();
  }, [pagination.page, selectedType, selectedStatus, searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Brokers fetch only their own properties
      const response = await propertyAPI.getByBroker();

      // Normalize response shape (array or { properties, total })
      const rawList = Array.isArray(response.data)
        ? response.data
        : response.data.properties || [];
      const total = Array.isArray(response.data)
        ? rawList.length
        : response.data.total || rawList.length;

      // Client-side filter (since getByBroker doesn't take filters)
      const filtered = rawList.filter((p) => {
        const matchesSearch =
          !searchTerm ||
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'all' || p.type === selectedType;
        const matchesStatus =
          selectedStatus === 'all' || p.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
      });

      // Client-side pagination
      const start = (pagination.page - 1) * pagination.limit;
      const paginated = filtered.slice(start, start + pagination.limit);

      setProperties(paginated);
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / prev.limit))
      }));
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await userAPI.getByRole('agent');
      setAgents(response.data.users || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      setError('Please select an agent');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await propertyAPI.update(assignProperty.id, {
        agent_id: parseInt(selectedAgentId)
      });
      setSuccessMessage(
        `Agent assigned successfully to ${assignProperty.title}!`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAssignModal(false);
      setAssignProperty(null);
      setSelectedAgentId('');
      fetchProperties();
    } catch (err) {
      console.error('Error assigning agent:', err);
      setError('Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      await propertyAPI.update(editingProperty.id, editingProperty);
      setSuccessMessage('Property updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Failed to update property');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await propertyAPI.delete(propertyToDelete.id);
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      setSuccessMessage('Property deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'house':
        return 'bg-blue-100 text-blue-800';
      case 'condo':
        return 'bg-purple-100 text-purple-800';
      case 'townhouse':
        return 'bg-green-100 text-green-800';
      case 'commercial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get agent name by ID
  const getAgentName = (agentId) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : 'Unassigned';
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="broker" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">My Properties</h1>
                <p className="text-white/80 mt-1">
                  Manage properties and assign agents
                </p>
              </div>
              <Link
                to="/add-property"
                className="bg-white/20 text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition flex items-center gap-2 backdrop-blur-sm"
              >
                <Plus size={18} />
                Add Property
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <Check size={18} />
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

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-pastel-green">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search properties by title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                >
                  <option value="all">All Types</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="commercial">Commercial</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {properties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-pastel-green">
              <Home size={48} className="mx-auto text-light-text mb-4" />
              <h3 className="text-xl font-semibold text-dark-text mb-2">
                No properties found
              </h3>
              <p className="text-light-text">
                Try adjusting your search filters
              </p>
              <Link
                to="/add-property"
                className="mt-4 inline-block px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
              >
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border border-pastel-green"
                >
                  <img
                    src={getImageUrl(property.images?.[0])}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-dark-text truncate">
                        {property.title}
                      </h3>
                      <div className="flex gap-1">
                        <Link
                          to={`/property/${property.id}`}
                          className="text-light-text hover:text-soft-green transition p-1"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => setEditingProperty(property)}
                          className="text-light-text hover:text-soft-green transition p-1"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setAssignProperty(property);
                            setShowAssignModal(true);
                          }}
                          className="text-light-text hover:text-warm-orange transition p-1"
                          title="Assign Agent"
                        >
                          <UserPlus size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setPropertyToDelete(property);
                            setShowDeleteModal(true);
                          }}
                          className="text-light-text hover:text-red-500 transition p-1"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center text-light-text mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>

                    <p className="text-soft-green font-bold text-xl mb-3">
                      {formatPrice(property.price)}
                    </p>

                    <div className="flex justify-between text-sm text-light-text border-t border-pastel-green pt-3 mb-3">
                      <span className="flex items-center">
                        <Bed size={14} className="mr-1" />{' '}
                        {property.bedrooms || 0} beds
                      </span>
                      <span className="flex items-center">
                        <Bath size={14} className="mr-1" />{' '}
                        {property.bathrooms || 0} baths
                      </span>
                      <span className="flex items-center">
                        <Square size={14} className="mr-1" />{' '}
                        {property.area || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(
                          property.type
                        )}`}
                      >
                        {property.type}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(
                          property.status
                        )}`}
                      >
                        {property.status}
                      </span>
                    </div>

                    {/* Agent Info */}
                    <div className="flex items-center gap-1 text-xs text-light-text mt-2 pt-2 border-t border-pastel-green">
                      <User size={12} />
                      <span>Agent: </span>
                      <span className="font-medium text-dark-text">
                        {getAgentName(property.agent_id)}
                      </span>
                      {!property.agent_id && (
                        <button
                          onClick={() => {
                            setAssignProperty(property);
                            setShowAssignModal(true);
                          }}
                          className="ml-auto text-soft-green hover:text-warm-orange transition text-xs font-medium"
                        >
                          Assign Agent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md px-6 py-4 mt-6 border border-pastel-green flex items-center justify-between">
              <p className="text-sm text-light-text">
                Showing {properties.length} of {pagination.total} properties
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-pastel-green rounded-lg disabled:opacity-50 hover:bg-pastel-orange transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-dark-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-pastel-green rounded-lg disabled:opacity-50 hover:bg-pastel-orange transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Assign Agent Modal */}
          {showAssignModal && assignProperty && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full border border-pastel-green">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-warm-orange/20 flex items-center justify-center text-warm-orange">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-text">
                    Assign Agent
                  </h3>
                </div>
                <p className="text-light-text mb-4">
                  Property:{' '}
                  <span className="font-semibold text-dark-text">
                    {assignProperty.title}
                  </span>
                </p>
                <div className="mb-4">
                  <label className="block text-dark-text text-sm font-bold mb-2">
                    Select Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                  >
                    <option value="">-- Select an agent --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignProperty(null);
                      setSelectedAgentId('');
                    }}
                    className="px-4 py-2 text-light-text hover:bg-pastel-orange rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignAgent}
                    disabled={assigning}
                    className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {assigning ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                    {assigning ? 'Assigning...' : 'Assign Agent'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Property Modal */}
          {editingProperty && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pastel-green">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-dark-text">
                    Edit Property
                  </h3>
                  <button
                    onClick={() => setEditingProperty(null)}
                    className="text-light-text hover:text-dark-text transition"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleUpdateProperty}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editingProperty.title || ''}
                        onChange={(e) =>
                          setEditingProperty({
                            ...editingProperty,
                            title: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        value={editingProperty.description || ''}
                        onChange={(e) =>
                          setEditingProperty({
                            ...editingProperty,
                            description: e.target.value
                          })
                        }
                        rows="3"
                        className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Price (₱) *
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                          size={16}
                        />
                        <input
                          type="number"
                          value={editingProperty.price || ''}
                          onChange={(e) =>
                            setEditingProperty({
                              ...editingProperty,
                              price: e.target.value
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Location *
                      </label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                          size={16}
                        />
                        <input
                          type="text"
                          value={editingProperty.location || ''}
                          onChange={(e) =>
                            setEditingProperty({
                              ...editingProperty,
                              location: e.target.value
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Bedrooms
                      </label>
                      <div className="relative">
                        <Bed
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                          size={16}
                        />
                        <input
                          type="number"
                          value={editingProperty.bedrooms || ''}
                          onChange={(e) =>
                            setEditingProperty({
                              ...editingProperty,
                              bedrooms: e.target.value
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Bathrooms
                      </label>
                      <div className="relative">
                        <Bath
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                          size={16}
                        />
                        <input
                          type="number"
                          value={editingProperty.bathrooms || ''}
                          onChange={(e) =>
                            setEditingProperty({
                              ...editingProperty,
                              bathrooms: e.target.value
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Area (sqm)
                      </label>
                      <div className="relative">
                        <Square
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text"
                          size={16}
                        />
                        <input
                          type="text"
                          value={editingProperty.area || ''}
                          onChange={(e) =>
                            setEditingProperty({
                              ...editingProperty,
                              area: e.target.value
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                          placeholder="e.g., 85 sqm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Type
                      </label>
                      <select
                        value={editingProperty.type || 'house'}
                        onChange={(e) =>
                          setEditingProperty({
                            ...editingProperty,
                            type: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                      >
                        <option value="house">House</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-dark-text text-sm font-bold mb-2">
                        Status
                      </label>
                      <select
                        value={editingProperty.status || 'available'}
                        onChange={(e) =>
                          setEditingProperty({
                            ...editingProperty,
                            status: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
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
                      className="px-4 py-2 text-light-text hover:bg-pastel-orange rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating ? (
                        <Loader className="animate-spin" size={18} />
                      ) : (
                        <Check size={18} />
                      )}
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full border border-pastel-green">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-text">
                    Delete Property
                  </h3>
                </div>
                <p className="text-light-text mb-6">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-dark-text">
                    {propertyToDelete?.title}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-light-text hover:bg-pastel-orange rounded-lg transition"
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

export default BrokerProperties;