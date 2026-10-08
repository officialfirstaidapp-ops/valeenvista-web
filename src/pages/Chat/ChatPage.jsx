import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Loader,
  Search,
  MessageCircle,
  ArrowLeft,
  User,
  UserPlus,
  X,
  Mail,
  Video
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket, formatLastSeen } from '../../context/SocketContext';
import { chatAPI, userAPI } from '../../services/api';

const ChatPage = () => {
  const { user } = useAuth();
  const { socket, isUserOnline, lastSeenMap } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);

  // New chat modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingChat, setStartingChat] = useState(null);

  // ✅ Who can start new chats?
  const canSearchUsers =
    user?.role === 'admin' ||
    user?.role === 'broker' ||
    user?.role === 'agent';

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (selectedConversation && message.conversation_id === selectedConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
      fetchConversations();
    };

    const handleUserTyping = ({ userName, conversationId }) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setTypingUser(userName);
      }
    };

    const handleUserStopTyping = ({ conversationId }) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setTypingUser(null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === parseInt(conversationId));
      if (conv) handleSelectConversation(conv);
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    const userIds = conversations.map((c) => c.other_user_id).filter(Boolean);
    if (userIds.length > 0) socket.emit('get_user_status', { userIds });
  }, [socket, conversations]);

  // ✅ Debounced scoped search
  useEffect(() => {
    if (!showNewChatModal) return;
    if (!userSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const response = await userAPI.searchChatUsers(userSearchTerm);
        const users = (response.data.users || []).filter((u) => u.id !== user?.id);
        setSearchResults(users);
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, showNewChatModal, user]);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowMobileList(false);

    if (socket) {
      socket.emit('join_conversation', conversation.id);
      socket.emit('mark_as_read', { conversationId: conversation.id });
    }

    await fetchMessages(conversation.id);

    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleStartChatWith = async (otherUser) => {
    setStartingChat(otherUser.id);
    try {
      const response = await chatAPI.getOrCreateConversation({
        other_user_id: otherUser.id
      });
      const conversation = response.data.conversation;

      await fetchConversations();
      setShowNewChatModal(false);
      setUserSearchTerm('');
      setSearchResults([]);

      if (conversation) {
        handleSelectConversation(conversation);
      }
    } catch (err) {
      console.error('Start chat error:', err);
      alert('Failed to start chat');
    } finally {
      setStartingChat(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    setSendingMessage(true);
    try {
      socket.emit('send_message', {
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.other_user_id,
        message: newMessage.trim()
      });
      socket.emit('stop_typing', { conversationId: selectedConversation.id });
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedConversation) return;
    socket.emit('typing', { conversationId: selectedConversation.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: selectedConversation.id });
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSelectedConversation(null);
    if (socket && selectedConversation) {
      socket.emit('leave_conversation', selectedConversation.id);
    }
  };

  const handleStartVideoCall = () => {
    if (!selectedConversation || !user) return;

    const otherUserId = selectedConversation.other_user_id;
    if (!otherUserId) return;

    const sortedIds = [user.id, otherUserId].sort((a, b) => a - b);
    const roomName = `valeen-chat-${sortedIds[0]}-${sortedIds[1]}`;

    navigate(`/video-call/${roomName}`);
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `https://valeenvista-backend.onrender.com${avatarPath}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUserStatusText = (userId) => {
    if (isUserOnline(userId)) return 'Online';
    const lastSeen = lastSeenMap[userId];
    if (!lastSeen) return 'Offline';
    return `Last seen ${formatLastSeen(lastSeen)}`;
  };

  const filteredConversations = conversations.filter((c) =>
    c.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.property_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper text for the modal header
  const searchHint =
    user?.role === 'broker'
      ? 'Search admins or your agents'
      : user?.role === 'admin'
      ? 'Search any user'
      : user?.role === 'agent'
      ? 'Search admins or your broker'
      : 'Search for a user';

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar userRole={user?.role} />
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
      <Sidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden p-4 sm:p-6">
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-pastel-green dark:border-gray-700 overflow-hidden flex">

            {/* Conversation List */}
            <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-pastel-green dark:border-gray-700 flex flex-col ${
              showMobileList ? 'block' : 'hidden md:flex'
            }`}>
              <div className="p-4 border-b border-pastel-green dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-dark-text dark:text-white">Messages</h2>
                  {canSearchUsers && (
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition text-sm font-medium"
                      title="New Chat"
                    >
                      <UserPlus size={16} />
                      New
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green text-sm bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle size={48} className="mx-auto text-light-text dark:text-gray-500 mb-3" />
                    <p className="text-light-text dark:text-gray-400 text-sm">
                      {searchTerm ? 'No conversations match' : 'No conversations yet'}
                    </p>
                    {canSearchUsers && !searchTerm && (
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="mt-3 text-sm text-soft-green hover:text-warm-orange transition font-medium"
                      >
                        + Start a new chat
                      </button>
                    )}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 border-b border-pastel-green dark:border-gray-700 hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition ${
                        selectedConversation?.id === conv.id ? 'bg-pastel-green/30 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {conv.other_user_avatar ? (
                            <img
                              src={getAvatarUrl(conv.other_user_avatar)}
                              alt={conv.other_user_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold">
                              {conv.other_user_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                            isUserOnline(conv.other_user_id) ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="font-semibold text-dark-text dark:text-white truncate">
                              {conv.other_user_name || 'User'}
                            </p>
                            {conv.last_message_at && (
                              <span className="text-xs text-light-text dark:text-gray-400 ml-2">
                                {formatTime(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                          {conv.property_title ? (
                            <p className="text-xs text-soft-green truncate">🏠 {conv.property_title}</p>
                          ) : (
                            <p className="text-xs text-light-text dark:text-gray-400 capitalize">
                              {conv.other_user_role || 'User'}
                            </p>
                          )}
                          <p className="text-sm text-light-text dark:text-gray-400 truncate mt-0.5">
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>

                        {conv.unread_count > 0 && (
                          <span className="bg-soft-green text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div className={`flex-1 flex flex-col ${!showMobileList ? 'block' : 'hidden md:flex'}`}>
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-pastel-green dark:border-gray-700 flex items-center gap-3">
                    <button
                      onClick={handleBackToList}
                      className="md:hidden p-1 text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="relative">
                      {selectedConversation.other_user_avatar ? (
                        <img
                          src={getAvatarUrl(selectedConversation.other_user_avatar)}
                          alt={selectedConversation.other_user_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold">
                          {selectedConversation.other_user_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                        isUserOnline(selectedConversation.other_user_id) ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-text dark:text-white truncate">
                        {selectedConversation.other_user_name || 'User'}
                      </p>
                      <p className={`text-xs truncate ${
                        isUserOnline(selectedConversation.other_user_id) ? 'text-green-500' : 'text-light-text dark:text-gray-400'
                      }`}>
                        {getUserStatusText(selectedConversation.other_user_id)}
                        {selectedConversation.property_title && (
                          <span className="text-soft-green"> · About: {selectedConversation.property_title}</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={handleStartVideoCall}
                      className="flex items-center gap-2 px-3 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition text-sm font-medium"
                      title="Start Video Call"
                    >
                      <Video size={18} />
                      <span className="hidden sm:inline">Video Call</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle size={48} className="mx-auto text-light-text dark:text-gray-500 mb-3" />
                        <p className="text-light-text dark:text-gray-400 text-sm">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => {
                          const isOwn = msg.sender_id === user?.id;
                          const showDate = index === 0 ||
                            formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);

                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="text-center my-4">
                                  <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs text-light-text dark:text-gray-400 shadow-sm">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-soft-green text-white rounded-br-sm'
                                    : 'bg-white dark:bg-gray-800 text-dark-text dark:text-white rounded-bl-sm shadow-sm'
                                }`}>
                                  {!isOwn && (
                                    <p className="text-xs font-semibold mb-1 opacity-70">
                                      {msg.sender_name}
                                    </p>
                                  )}
                                  <p className="text-sm break-words">{msg.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    isOwn ? 'text-white/70' : 'text-light-text dark:text-gray-400'
                                  }`}>
                                    {formatTime(msg.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}

                    {typingUser && (
                      <div className="flex justify-start mb-3">
                        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                          <p className="text-xs text-light-text dark:text-gray-400 italic">
                            {typingUser} is typing...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-pastel-green dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-5 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <MessageCircle size={64} className="mx-auto text-light-text dark:text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-dark-text dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-light-text dark:text-gray-400 mb-4">
                      Choose a conversation from the list to start messaging
                    </p>
                    {canSearchUsers && (
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"
                      >
                        <UserPlus size={18} />
                        Start New Chat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-pastel-green dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-pastel-green dark:border-gray-700">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-soft-green" />
                <h3 className="text-lg font-semibold text-dark-text dark:text-white">
                  New Chat
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setUserSearchTerm('');
                  setSearchResults([]);
                }}
                className="text-light-text dark:text-gray-400 hover:text-dark-text dark:hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 border-b border-pastel-green dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text dark:text-gray-400" size={18} />
                <input
                  type="text"
                  autoFocus
                  placeholder={searchHint}
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-pastel-green dark:border-gray-600 rounded-lg focus:outline-none focus:border-soft-green bg-white dark:bg-gray-700 text-dark-text dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searchingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-soft-green" size={32} />
                </div>
              ) : !userSearchTerm.trim() ? (
                <div className="text-center py-12 px-4">
                  <User size={48} className="mx-auto text-light-text dark:text-gray-500 mb-3" />
                  <p className="text-light-text dark:text-gray-400 text-sm">
                    {searchHint}
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <User size={48} className="mx-auto text-light-text dark:text-gray-500 mb-3" />
                  <p className="text-light-text dark:text-gray-400 text-sm">
                    No users found
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartChatWith(u)}
                      disabled={startingChat === u.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-pastel-orange/20 dark:hover:bg-gray-700 transition text-left disabled:opacity-50"
                    >
                      <div className="relative flex-shrink-0">
                        {u.avatar ? (
                          <img
                            src={getAvatarUrl(u.avatar)}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-soft-green flex items-center justify-center text-white font-semibold">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                          isUserOnline(u.id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-dark-text dark:text-white truncate">
                            {u.name}
                          </p>
                          <span className="text-xs bg-pastel-green/50 dark:bg-emerald-900/50 text-soft-green px-2 py-0.5 rounded-full capitalize">
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-light-text dark:text-gray-400 truncate flex items-center gap-1">
                          <Mail size={12} />
                          {u.email}
                        </p>
                        <p className={`text-xs ${
                          isUserOnline(u.id) ? 'text-green-500' : 'text-light-text dark:text-gray-500'
                        }`}>
                          {isUserOnline(u.id) ? 'Online' : `Last seen ${formatLastSeen(lastSeenMap[u.id]) || 'a while ago'}`}
                        </p>
                      </div>

                      {startingChat === u.id && (
                        <Loader className="animate-spin text-soft-green" size={18} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;