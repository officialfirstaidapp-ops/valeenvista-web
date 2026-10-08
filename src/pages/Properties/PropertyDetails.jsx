import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Calendar,
  MessageCircle,
  Video,
  ArrowLeft,
  Phone,
  Mail,
  Loader,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { propertyAPI, chatAPI, reservationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReservationModal from '../../components/ReservationModal';

const PropertyDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const [myReservation, setMyReservation] = useState(null);
  const [checkingReservation, setCheckingReservation] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/800x500';
    if (imagePath.startsWith('http')) return imagePath;
    return `https://valeenvista-backend.onrender.com${imagePath}`;
  };

  const getBackLink = () => {
    if (location.pathname.includes('/admin') || document.referrer.includes('/admin')) {
      return '/admin/properties';
    }
    if (location.pathname.includes('/broker') || document.referrer.includes('/broker')) {
      return '/broker';
    }
    if (location.pathname.includes('/agent') || document.referrer.includes('/agent')) {
      return '/agent';
    }
    return '/properties';
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    const checkMyReservation = async () => {
      if (!user || user.role !== 'client' || !id) return;

      setCheckingReservation(true);
      try {
        const response = await reservationAPI.getMyReservations();
        const reservations = response.data.reservations || [];
        const found = reservations.find(
          (r) => String(r.property_id) === String(id) &&
                 ['pending', 'approved', 'completed'].includes(r.status)
        );
        setMyReservation(found || null);
      } catch (err) {
        console.error('Error checking reservation:', err);
      } finally {
        setCheckingReservation(false);
      }
    };

    checkMyReservation();
  }, [user, id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getById(id);
      setProperty(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatWithAgent = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!property.agent_id) {
      alert('No agent assigned to this property yet.');
      return;
    }

    setStartingChat(true);
    try {
      const response = await chatAPI.getOrCreateConversation({
        other_user_id: property.agent_id,
        property_id: property.id
      });
      navigate(`/chat?conversation=${response.data.conversation.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleStartVideoCall = async () => {
    if (!myReservation) return;

    if (myReservation.status !== 'approved') {
      alert('Video call is only available for approved reservations.');
      return;
    }

    try {
      const response = await reservationAPI.getVideoRoom(myReservation.id);
      navigate(`/video-call/${response.data.roomName}`);
    } catch (err) {
      console.error('Failed to start video call:', err);
      alert(err.response?.data?.error || 'Failed to start video call');
    }
  };

  const nextImage = () => {
    if (property?.images?.length > 0) {
      setActiveImage((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images?.length > 0) {
      setActiveImage((prev) => (prev - 1 + property.images.length) % property.images.length);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'This property currently has a pending reservation.';
      case 'sold':
        return 'This property has been sold.';
      case 'cancelled':
        return 'This property is no longer available.';
      default:
        return 'This property is not currently available for viewing.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader className="animate-spin text-soft-green" size={48} />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <Home size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Property Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "The property you're looking for doesn't exist."}</p>
          <Link
            to="/properties"
            className="inline-flex items-center text-soft-green hover:text-warm-orange"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://via.placeholder.com/800x500'];

  const backLink = getBackLink();
  const isAvailable = property.status === 'available';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link to={backLink} className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-soft-green">
          <ArrowLeft size={20} className="mr-2" />
          Back to Properties
        </Link>
      </div>

      {myReservation && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg flex flex-wrap items-center gap-3">
            <CheckCircle size={20} />
            <span className="font-medium flex-1">
              You have a <strong className="capitalize">{myReservation.status}</strong> reservation on this property — {formatDate(myReservation.reservation_date)} at {formatTime(myReservation.reservation_time)}
            </span>
            <Link
              to="/dashboard"
              state={{ activeTab: 'reservations' }}
              className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
            >
              View in My Reservations
            </Link>
          </div>
        </div>
      )}

      {!isAvailable && !myReservation && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">
              {getStatusMessage(property.status)}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 border border-pastel-green dark:border-gray-700">
              {/* ✅ Full image with blurred backdrop */}
              <div className="relative bg-gray-100 dark:bg-gray-900 h-96 overflow-hidden">
                <img
                  src={getImageUrl(images[activeImage])}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                />
                <img
                  src={getImageUrl(images[activeImage])}
                  alt={property.title}
                  className="relative w-full h-full object-contain z-10"
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition z-20"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition z-20"
                    >
                      <ChevronRight size={24} />
                    </button>

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-20">
                      {activeImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        activeImage === index ? 'border-soft-green' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-pastel-green dark:border-gray-700">
              <h1 className="text-3xl font-bold text-dark-text dark:text-white mb-2">{property.title}</h1>

              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <MapPin size={18} className="mr-1" />
                <span>{property.location}</span>
              </div>

              <p className="text-3xl font-bold text-soft-green mb-6">{formatPrice(property.price)}</p>

              <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200 dark:border-gray-700 mb-6">
                <div className="text-center">
                  <Bed size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bedrooms</p>
                  <p className="font-semibold text-dark-text dark:text-white">{property.bedrooms || 0}</p>
                </div>
                <div className="text-center">
                  <Bath size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bathrooms</p>
                  <p className="font-semibold text-dark-text dark:text-white">{property.bathrooms || 0}</p>
                </div>
                <div className="text-center">
                  <Square size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
                  <p className="font-semibold text-dark-text dark:text-white">{property.area || 'N/A'}</p>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-dark-text dark:text-white mb-4">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{property.description || 'No description available.'}</p>

              {property.features?.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-dark-text dark:text-white mb-4">Features</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-soft-green rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {(property.agent_name || property.agent_id) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 sticky top-6 border border-pastel-green dark:border-gray-700">
                <h2 className="text-xl font-semibold text-dark-text dark:text-white mb-4">Contact Agent</h2>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-soft-green flex items-center justify-center text-white text-2xl font-semibold">
                    {property.agent_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-text dark:text-white">{property.agent_name || 'Property Agent'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Licensed Real Estate Agent</p>
                  </div>
                </div>

                {property.agent_phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                    <Phone size={18} className="mr-3 text-gray-400" />
                    <span>{property.agent_phone}</span>
                  </div>
                )}

                {property.agent_email && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
                    <Mail size={18} className="mr-3 text-gray-400" />
                    <span>{property.agent_email}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {user ? (
                    <>
                      {myReservation ? (
                        <>
                          {myReservation.status === 'approved' && (
                            <button
                              onClick={handleStartVideoCall}
                              className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center gap-2 font-medium"
                            >
                              <Video size={18} />
                              Join Video Call
                            </button>
                          )}

                          {myReservation.status === 'pending' && (
                            <div className="w-full bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 py-3 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                              <Clock size={18} />
                              Awaiting Agent Approval
                            </div>
                          )}

                          {myReservation.status === 'completed' && (
                            <div className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 py-3 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                              <CheckCircle size={18} />
                              Viewing Completed
                            </div>
                          )}

                          <Link
                            to="/dashboard"
                            state={{ activeTab: 'reservations' }}
                            className="w-full bg-soft-green text-white py-3 rounded-lg hover:bg-warm-orange transition flex items-center justify-center gap-2 font-medium"
                          >
                            <Calendar size={18} />
                            My Reservations
                          </Link>
                        </>
                      ) : (
                        <>
                          {isAvailable ? (
                            <button
                              onClick={() => setShowReservationModal(true)}
                              className="w-full bg-warm-orange text-white py-3 rounded-lg hover:bg-soft-green transition flex items-center justify-center gap-2 font-medium"
                            >
                              <Calendar size={18} />
                              Schedule Viewing
                            </button>
                          ) : (
                            <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3 rounded-lg text-center font-medium">
                              Not Available for Viewing
                            </div>
                          )}
                        </>
                      )}

                      {property.agent_id && (
                        <button
                          onClick={handleChatWithAgent}
                          disabled={startingChat}
                          className="w-full bg-soft-green text-white py-3 rounded-lg hover:bg-warm-orange transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {startingChat ? (
                            <Loader className="animate-spin" size={18} />
                          ) : (
                            <MessageCircle size={18} />
                          )}
                          {startingChat ? 'Starting chat...' : 'Chat with Agent'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="w-full bg-soft-green text-white py-3 rounded-lg hover:bg-warm-orange transition flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={18} />
                        Login to Chat
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        <Link to="/register" className="text-soft-green">Sign up</Link> to contact agents
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReservationModal && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          property={property}
          onSuccess={() => {
            setShowReservationModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default PropertyDetails;