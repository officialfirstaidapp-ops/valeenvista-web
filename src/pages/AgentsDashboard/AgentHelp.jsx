import React, { useState } from 'react';
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle, 
  Book, 
  Video, 
  FileText,
  Send,
  Loader,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

const AgentHelp = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    
    // Simulate sending
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('✅ Your message has been sent successfully!');
      setFormData({ subject: '', message: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1000);
  };

  const faqs = [
    {
      question: 'How do I manage my property listings?',
      answer: 'Go to Properties tab in your dashboard to view, edit, or delete your assigned properties.'
    },
    {
      question: 'How do I approve a reservation request?',
      answer: 'Navigate to Reservations tab, find the pending request, and click the "Approve" button.'
    },
    {
      question: 'How do I track my commissions?',
      answer: 'Go to Commissions tab to view your total earnings and commission history.'
    },
    {
      question: 'What should I do if a client cancels?',
      answer: 'You can update the reservation status or contact the client directly through the platform.'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="agent" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
            <div>
              <h1 className="text-3xl font-bold">Help & Support</h1>
              <p className="text-white/80 mt-1">Get help and support for your account</p>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          {/* Quick Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green text-center hover:shadow-lg transition">
              <div className="w-12 h-12 bg-pastel-green rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-soft-green" />
              </div>
              <h3 className="font-semibold text-dark-text">Email Support</h3>
              <p className="text-sm text-light-text">support@valeenvista.com</p>
              <p className="text-xs text-light-text mt-1">Response within 24 hours</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green text-center hover:shadow-lg transition">
              <div className="w-12 h-12 bg-pastel-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-warm-orange" />
              </div>
              <h3 className="font-semibold text-dark-text">Phone Support</h3>
              <p className="text-sm text-light-text">+63 912 345 6789</p>
              <p className="text-xs text-light-text mt-1">Mon-Fri, 9AM-6PM</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green text-center hover:shadow-lg transition">
              <div className="w-12 h-12 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={24} className="text-warm-orange" />
              </div>
              <h3 className="font-semibold text-dark-text">Live Chat</h3>
              <p className="text-sm text-light-text">Chat with our support team</p>
              <p className="text-xs text-light-text mt-1">Available 24/7</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Book size={20} className="text-soft-green" />
              <h2 className="text-lg font-semibold text-dark-text">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-pastel-green rounded-lg p-4 hover:bg-pastel-orange/10 transition">
                  <p className="font-medium text-dark-text flex items-center gap-2">
                    <ChevronRight size={16} className="text-soft-green" />
                    {faq.question}
                  </p>
                  <p className="text-sm text-light-text mt-1 ml-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
            <div className="flex items-center gap-3 mb-4">
              <Send size={20} className="text-soft-green" />
              <h2 className="text-lg font-semibold text-dark-text">Send us a message</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-dark-text text-sm font-bold mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                  placeholder="What is your question about?"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-dark-text text-sm font-bold mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                  placeholder="Describe your issue or question in detail..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition font-medium disabled:opacity-50"
                >
                  {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentHelp;