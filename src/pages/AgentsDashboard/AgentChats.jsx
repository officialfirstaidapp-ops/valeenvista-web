import React from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

const AgentChats = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="agent" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text">Chats</h1>
              <p className="text-light-text mt-1">Connect with your clients</p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-pastel-green">
            <div className="w-20 h-20 bg-pastel-green/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={40} className="text-soft-green" />
            </div>
            <h2 className="text-2xl font-bold text-dark-text mb-2">Chat Feature Coming Soon</h2>
            <p className="text-light-text max-w-md mx-auto">
              We're building a real-time chat system to help you communicate directly with your clients.
              Stay tuned for updates!
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-light-text">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Expected release: Coming soon</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentChats;