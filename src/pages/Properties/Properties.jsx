import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Home, Filter, X, Loader } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { propertyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Properties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://valeenvista-backend.onrender.com${imagePath}`;
  };

  const getDashboardRoute = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return '/admin';
      case 'broker': return '/broker';
      case 'agent': return '/agent';
      case 'client': return '/dashboard';
      default: return null;
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters, pagination.page]);

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const apiFilters = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      Object.keys(apiFilters).forEach(key => {
        if (!apiFilters[key] && apiFilters[key] !== 0) delete apiFilters[key];
      });

      const response = await propertyAPI.getAll(apiFilters);
      setProperties(response.data.properties || []);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      try {
        setLoading(true);
        const response = await propertyAPI.search(searchTerm);
        setProperties(response.data.properties || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages
        });
        setError(null);
      } catch (err) {
        console.error('Error searching properties:', err);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      fetchProperties();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const dashboardRoute = getDashboardRoute();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {user && dashboardRoute && (
        <div className="bg-gradient-to-r from-soft-green to-warm-orange px-6 pt-4 pb-3 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={dashboardRoute}
                className="flex items-center gap-2 text-white hover:text-white/80 transition font-medium"
              >
                <Home size={18} />
                <span>Back to Dashboard</span>
              </Link>
              <span className="text-white/30">|</span>
              <span className="text-white/80 text-sm capitalize">
                {user.role}: {user.name}
              </span>
            </div>
            <span className="text-white/60 text-sm hidden md:block">
              Viewing available properties
            </span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-soft-green to-warm-orange text-white pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Find Your Dream Property</h1>
          <p className="text-xl text-white/80">Browse through our extensive collection of properties</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-pastel-green dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text" size={20} />
              <input
                type="text"
                placeholder="Search by property name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition flex items-center gap-2"
            >
              <Search size={20} />
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-pastel-orange/30 dark:bg-amber-900/30 text-dark-text dark:text-white rounded-lg hover:bg-pastel-orange dark:hover:bg-amber-900/50 transition flex items-center gap-2"
            >
              <Filter size={20} />
              Filters
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-pastel-green dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text dark:text-white mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="City or area"
                  className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text dark:text-white mb-2">Property Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="commercial">Commercial</option>
                  <option value="lot">Lot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text dark:text-white mb-2">Min Price</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="₱"
                  className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text dark:text-white mb-2">Max Price</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="₱"
                  className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text dark:text-white mb-2">Bedrooms</label>
                <select
                  name="bedrooms"
                  value={filters.bedrooms}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <p className="text-light-text dark:text-gray-400">
          Showing <span className="font-semibold text-dark-text dark:text-white">{properties.length}</span> of{' '}
          <span className="font-semibold text-dark-text dark:text-white">{pagination.total}</span> available properties
        </p>
        {(filters.location || filters.type || filters.minPrice || filters.maxPrice || filters.bedrooms || searchTerm) && (
          <button
            onClick={clearFilters}
            className="text-soft-green hover:text-warm-orange transition flex items-center gap-1 font-medium"
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-soft-green" size={40} />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 p-8">
            <Home size={64} className="mx-auto text-light-text mb-4" />
            <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">Error Loading Properties</h3>
            <p className="text-light-text dark:text-gray-400">{error}</p>
            <button
              onClick={fetchProperties}
              className="mt-4 px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
            >
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 p-8">
            <Home size={64} className="mx-auto text-light-text mb-4" />
            <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">No available properties</h3>
            <p className="text-light-text dark:text-gray-400">Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/property/${property.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition border border-pastel-green dark:border-gray-700 hover:border-soft-green"
                >
                  {/* ✅ Full image with blurred backdrop */}
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <img
                      src={getImageUrl(property.images?.[0])}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-60"
                    />
                    <img
                      src={getImageUrl(property.images?.[0])}
                      alt={property.title}
                      className="relative w-full h-full object-contain z-10"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-dark-text dark:text-white mb-1">{property.title}</h3>
                    <div className="flex items-center text-light-text dark:text-gray-400 mb-2">
                      <MapPin size={16} className="mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <p className="text-soft-green font-bold text-xl mb-3">{formatPrice(property.price)}</p>

                    <div className="flex justify-between text-sm text-light-text dark:text-gray-400 border-t border-pastel-green dark:border-gray-700 pt-3">
                      <span>{property.bedrooms || 0} beds</span>
                      <span>{property.bathrooms || 0} baths</span>
                      <span>{property.area || 'N/A'}</span>
                    </div>

                    {property.agent_name && (
                      <div className="mt-3 text-xs text-light-text dark:text-gray-400">
                        Agent: <span className="text-dark-text dark:text-white">{property.agent_name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pastel-orange dark:hover:bg-gray-700 transition text-dark-text dark:text-white"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-dark-text dark:text-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pastel-orange dark:hover:bg-gray-700 transition text-dark-text dark:text-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Properties;