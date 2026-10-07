import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Home,
  Search,
  MessageCircle,
  Calendar,
  ArrowRight,
  Loader,
  Shield,
  Smartphone,
  Play
} from 'lucide-react';
import { propertyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ✅ APK download URL — Expo build page
const APK_DOWNLOAD_URL = 'https://github.com/officialfirstaidapp-ops/valeen/releases/download/v1.0.0/valeenvista.apk';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);

  // Redirect agents, admins, brokers away from landing page
  useEffect(() => {
    if (user) {
      if (user.role === 'agent') navigate('/agent');
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'broker') navigate('/broker');
    }
  }, [user, navigate]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll({ limit: 6, status: 'available' });
      setProperties(response.data.properties || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
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

  const handleApkDownload = () => {
    if (APK_DOWNLOAD_URL === '#') {
      alert('📱 The Android app is coming soon!\n\nStay tuned for the download link.');
      return;
    }
    window.open(APK_DOWNLOAD_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-green/20 via-pastel-yellow/10 to-pastel-orange/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-pastel-green dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="text-soft-green" size={32} />
            <span className="text-xl font-bold text-dark-text dark:text-white">ValeenVista</span>
          </div>
          <div className="flex items-center gap-3">
            {/* APK download — compact nav button */}
            <button
              onClick={handleApkDownload}
              className="hidden md:inline-flex items-center gap-2 text-dark-text dark:text-white border border-slate-200 dark:border-gray-600 px-3 py-1.5 rounded-lg hover:bg-pastel-green/20 dark:hover:bg-gray-700 hover:border-soft-green transition"
              title="Download Android App"
            >
              <Smartphone size={18} className="text-soft-green" />
              <span className="text-sm font-medium">Get App</span>
            </button>

            {user ? (
              <>
                {user.role === 'client' ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="hidden md:inline-flex items-center gap-2 text-dark-text dark:text-white border border-slate-200 dark:border-gray-600 px-3 py-1.5 rounded-lg hover:bg-pastel-green/20 dark:hover:bg-gray-700 hover:border-soft-green transition"
                    >
                      <Home size={20} strokeWidth={2.5} className="text-soft-green" />
                      <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                    <Link
                      to="/properties"
                      className="bg-soft-green text-white px-4 py-2 rounded-lg hover:bg-warm-orange transition"
                    >
                      Browse Properties
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/${user.role}`}
                    className="bg-soft-green text-white px-4 py-2 rounded-lg hover:bg-warm-orange transition"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-200 hover:text-soft-green dark:hover:text-soft-green px-4 py-2 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-soft-green text-white px-4 py-2 rounded-lg hover:bg-warm-orange transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO — Video Background with Animated Gradient Fallback */}
      <div className="hero-wrapper relative h-[600px] md:h-[700px] overflow-hidden">

        {/* Animated gradient fallback */}
        <div className="hero-animated-gradient absolute inset-0 z-0"></div>

        {/* Video on top of gradient */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-10"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={(e) => {
            console.warn('Hero video failed to load, using animated gradient fallback');
            if (e?.target) e.target.style.display = 'none';
          }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30 z-20 pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-30 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center text-white">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              Find Your Dream Property
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow">
              Browse thousands of properties, connect with agents, and schedule
              viewings — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/properties"
                className="bg-white text-soft-green px-6 py-3 rounded-lg font-semibold hover:bg-pastel-yellow transition shadow-lg"
              >
                Browse Properties
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-soft-green transition backdrop-blur-sm"
              >
                Get Started
              </Link>
              <button
                onClick={handleApkDownload}
                className="md:hidden inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
              >
                <Smartphone size={18} />
                Download App
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-pastel-green dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Location"
              className="px-4 py-3 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white"
            />
            <select className="px-4 py-3 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white">
              <option>Property Type</option>
              <option>House</option>
              <option>Condo</option>
              <option>Lot</option>
            </select>
            <select className="px-4 py-3 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow/20 dark:bg-gray-700 text-dark-text dark:text-white">
              <option>Price Range</option>
              <option>₱1M - ₱5M</option>
              <option>₱5M - ₱10M</option>
              <option>₱10M+</option>
            </select>
            <Link
              to="/properties"
              className="bg-soft-green text-white px-6 py-3 rounded-lg hover:bg-warm-orange transition flex items-center justify-center gap-2"
            >
              <Search size={18} />
              Search
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-dark-text dark:text-white">Featured Properties</h2>
          <Link
            to="/properties"
            className="text-soft-green hover:text-warm-orange transition font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-soft-green" size={40} />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 p-8">
            <Home size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
            <p className="text-light-text dark:text-gray-400">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 p-8">
            <Home size={48} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">
              No properties available
            </h3>
            <p className="text-light-text dark:text-gray-400">Check back soon for new listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition border border-pastel-green dark:border-gray-700 hover:border-soft-green"
              >
                <img
                  src={getImageUrl(property.images?.[0])}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-dark-text dark:text-white">
                    {property.title}
                  </h3>
                  <p className="text-light-text dark:text-gray-400">{property.location}</p>
                  <p className="text-soft-green font-bold text-xl mt-2">
                    {formatPrice(property.price)}
                  </p>
                  <Link
                    to={`/property/${property.id}`}
                    className="mt-4 inline-flex items-center text-soft-green hover:text-warm-orange transition"
                  >
                    View Details <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Why Choose ValeenVista */}
      <div className="bg-white dark:bg-gray-800 py-16 border-t border-b border-pastel-green dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-dark-text dark:text-white text-center mb-12">
            Why Choose ValeenVista?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-pastel-green dark:bg-emerald-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warm-orange transition">
                <MessageCircle className="text-soft-green group-hover:text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">
                Instant Chat
              </h3>
              <p className="text-light-text dark:text-gray-400">
                Chat directly with agents and brokers in real time
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-pastel-green dark:bg-emerald-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warm-orange transition">
                <Calendar className="text-soft-green group-hover:text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">
                Easy Scheduling
              </h3>
              <p className="text-light-text dark:text-gray-400">
                Book property viewings in just a few clicks
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-pastel-green dark:bg-emerald-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warm-orange transition">
                <Shield className="text-soft-green group-hover:text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">
                Secure Platform
              </h3>
              <p className="text-light-text dark:text-gray-400">
                Role-based access with verified users and encrypted data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-soft-green to-warm-orange py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to find your dream property?
          </h2>
          <p className="text-white/80 mb-8">Join thousands of satisfied clients today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-soft-green px-8 py-4 rounded-lg font-semibold hover:bg-pastel-yellow transition inline-block"
            >
              Get Started Now
            </Link>
            <button
              onClick={handleApkDownload}
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-soft-green transition"
            >
              <Smartphone size={20} />
              Download Android App
            </button>
          </div>
        </div>
      </div>

      {/* Developer Info Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-pastel-green dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-dark-text dark:text-white mb-2">
              Meet the Developers
            </h3>
            <p className="text-light-text dark:text-gray-400 text-sm">
              The team behind ValeenVista
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Developer 1 — Hannah */}
            <div className="bg-gradient-to-br from-pastel-green/40 to-pastel-yellow/20 dark:from-emerald-900/30 dark:to-gray-800 rounded-2xl overflow-hidden border border-pastel-green dark:border-gray-700 shadow-md hover:shadow-xl transition">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 h-40 sm:h-auto flex-shrink-0 bg-gradient-to-r from-soft-green to-warm-orange flex items-center justify-center">
                  <img
                    src="/developers/hannah.jpg"
                    alt="Hannah Dassel Farparan"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.outerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-white text-4xl font-bold">H</div>';
                    }}
                  />
                </div>
                <div className="flex-1 p-5">
                  <h4 className="text-lg font-bold text-dark-text dark:text-white">
                    Hannah Dassel Farparan
                  </h4>
                  <p className="text-sm text-soft-green font-semibold mb-2">
                    Lead Developer
                  </p>
                  <p className="text-xs text-light-text dark:text-gray-400 leading-relaxed">
                    Full-stack development · System architecture · API design
                  </p>
                </div>
              </div>
            </div>

            {/* Developer 2 — Nethche */}
            <div className="bg-gradient-to-br from-pastel-orange/40 to-pastel-yellow/20 dark:from-amber-900/30 dark:to-gray-800 rounded-2xl overflow-hidden border border-pastel-orange dark:border-gray-700 shadow-md hover:shadow-xl transition">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 h-40 sm:h-auto flex-shrink-0 bg-gradient-to-r from-warm-orange to-soft-green flex items-center justify-center">
                  <img
                    src="/developers/nethche.jpg"
                    alt="Nethche Laborte"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.outerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-white text-4xl font-bold">N</div>';
                    }}
                  />
                </div>
                <div className="flex-1 p-5">
                  <h4 className="text-lg font-bold text-dark-text dark:text-white">
                    Nethche Laborte
                  </h4>
                  <p className="text-sm text-warm-orange font-semibold mb-2">
                    UI/UX Designer & Frontend Developer
                  </p>
                  <p className="text-xs text-light-text dark:text-gray-400 leading-relaxed">
                    Interface design · User experience · Frontend development
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="mt-10 pt-6 border-t border-pastel-green dark:border-gray-700 text-center">
            <p className="text-xs text-light-text dark:text-gray-500">
              © {new Date().getFullYear()} ValeenVista. All rights reserved.
            </p>
            <p className="text-xs text-light-text dark:text-gray-500 mt-1">
              A real estate management platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;