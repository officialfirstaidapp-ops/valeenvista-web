import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

const ClientSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Mock FAQ Data for Clients
  const faqs = [
    {
      id: 1,
      question: "How do I book a property viewing?",
      answer: "Browse to the property listing you are interested in, click the 'Book Viewing' button, select your preferred date and time, and confirm. You will receive a confirmation email shortly."
    },
    {
      id: 2,
      question: "Can I cancel a reservation?",
      answer: "Yes. Go to your 'My Reservations' tab on your dashboard, find the reservation, and click the 'Cancel' button. Please note that cancellations made within 24 hours of the viewing may incur a fee."
    },
    {
      id: 3,
      question: "How do I update my profile information?",
      answer: "Go to the 'Profile' tab on your dashboard. You can update your name, phone number, and profile picture there. Click 'Save' to confirm your changes."
    },
    {
      id: 4,
      question: "How do I contact the agent for a specific property?",
      answer: "On the property details page, you will find the agent's name and contact number under the 'Contact Agent' section. You can call or email them directly."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess('Message sent successfully! We will get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="client" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-text flex items-center gap-2">
              <HelpCircle className="text-soft-green" size={28} />
              Help & Support
            </h1>
            <p className="text-light-text mt-1">Find answers to common questions or contact our support team</p>
          </div>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Contact Form */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-pastel-green">
              <div className="flex items-center gap-2 mb-4 border-b border-pastel-green pb-4">
                <Mail size={20} className="text-soft-green" />
                <h2 className="text-xl font-semibold text-dark-text">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Your Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-dark-text text-sm font-bold mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                  />
                </div>

                <div>
                  <label className="block text-dark-text text-sm font-bold mb-2">Message</label>
                  <textarea
                    required
                    rows="5"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send size={18} /> Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Quick Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green flex flex-col justify-between h-fit">
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-pastel-green pb-4">
                  <Phone size={20} className="text-soft-green" />
                  <h2 className="text-xl font-semibold text-dark-text">Quick Contact</h2>
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-pastel-green/20 rounded-lg">
                    <Mail size={18} className="text-soft-green" /> 
                    <div>
                      <p className="text-xs text-light-text">Email Address</p>
                      <a href="mailto:client.support@valeenvista.com" className="text-sm font-medium text-dark-text hover:text-soft-green transition">
                        client.support@valeenvista.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-pastel-green/20 rounded-lg">
                    <Phone size={18} className="text-soft-green" /> 
                    <div>
                      <p className="text-xs text-light-text">Phone Number</p>
                      <a href="tel:+639123456789" className="text-sm font-medium text-dark-text hover:text-soft-green transition">
                        +63 912 345 6789
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-pastel-green/20 rounded-lg">
                    <MessageSquare size={18} className="text-soft-green" /> 
                    <div>
                      <p className="text-xs text-light-text">Live Chat</p>
                      <button className="text-sm font-medium text-soft-green hover:underline transition">
                        Chat with an agent
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-pastel-green">
                <p className="text-xs text-light-text text-center">
                  Response time: <span className="text-dark-text font-semibold">Within 24 hours</span>
                </p>
              </div>
            </div>

            {/* Bottom Section: FAQs */}
            <div className="lg:col-span-3 mt-6">
              <div className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
                <div className="flex items-center gap-2 mb-6 border-b border-pastel-green pb-4">
                  <HelpCircle size={20} className="text-soft-green" />
                  <h2 className="text-xl font-semibold text-dark-text">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-pastel-green rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left"
                      >
                        <span className="font-medium text-dark-text">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp size={18} className="text-soft-green" />
                        ) : (
                          <ChevronDown size={18} className="text-light-text" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="p-4 pt-0 text-light-text bg-gray-50 border-t border-pastel-green">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientSupport;