import React from 'react';
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

const ClientProfile = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="client" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text">My Profile</h1>
            <p className="text-light-text mt-1">View and manage your personal information</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green max-w-3xl">
            <div className="flex items-center gap-6 mb-6 border-b border-pastel-green pb-6">
              <div className="w-20 h-20 rounded-full bg-soft-green flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-dark-text">{user?.name || 'Client User'}</h2>
                <p className="text-light-text">{user?.email || 'client@example.com'}</p>
                <span className="inline-block mt-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full capitalize">
                  {user?.role || 'Client'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={18} className="text-soft-green" />
                <div>
                  <p className="text-xs text-light-text">Email Address</p>
                  <p className="text-sm font-medium text-dark-text">{user?.email || 'client@example.com'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={18} className="text-soft-green" />
                <div>
                  <p className="text-xs text-light-text">Phone Number</p>
                  <p className="text-sm font-medium text-dark-text">+63 912 345 6789</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={18} className="text-soft-green" />
                <div>
                  <p className="text-xs text-light-text">Location</p>
                  <p className="text-sm font-medium text-dark-text">Metro Manila, Philippines</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-soft-green" />
                <div>
                  <p className="text-xs text-light-text">Member Since</p>
                  <p className="text-sm font-medium text-dark-text">January 2026</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium">
                Edit Profile
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientProfile;