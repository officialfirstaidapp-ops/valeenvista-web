import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading || !user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setLastSeenMap({});
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = connectSocket(token);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle new online_users structure with lastSeen
    newSocket.on('online_users', (data) => {
      if (Array.isArray(data)) {
        // Old format
        setOnlineUsers(data);
      } else {
        // New format: { userIds, lastSeen }
        setOnlineUsers(data.userIds || []);
        if (data.lastSeen) {
          setLastSeenMap((prev) => ({ ...prev, ...data.lastSeen }));
        }
      }
    });

    newSocket.on('user_online', ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
      if (lastSeen) {
        setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
      }
    });

    newSocket.on('user_offline', ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      if (lastSeen) {
        setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
      }
    });

    newSocket.on('user_status', (statuses) => {
      setLastSeenMap((prev) => {
        const updated = { ...prev };
        Object.keys(statuses).forEach((id) => {
          updated[id] = statuses[id].lastSeen;
        });
        return updated;
      });
    });

    newSocket.on('unread_count', ({ count }) => {
      setUnreadCount(count);
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('online_users');
      newSocket.off('user_online');
      newSocket.off('user_offline');
      newSocket.off('user_status');
      newSocket.off('unread_count');
    };
  }, [user, loading]);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const api = (await import('../services/api')).default;
          const response = await api.get('/chat/unread');
          setUnreadCount(response.data.count || 0);
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      };
      fetchUnreadCount();
    }
  }, [user]);

  // Helper: Check if a user is online
  const isUserOnline = (userId) => onlineUsers.includes(userId);

  // Helper: Get user status text
  const getUserStatusText = (userId) => {
    if (isUserOnline(userId)) {
      return 'Online';
    }

    const lastSeen = lastSeenMap[userId];
    if (!lastSeen) {
      return 'Offline';
    }

    return `Last seen ${formatLastSeen(lastSeen)}`;
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    lastSeenMap,
    unreadCount,
    setUnreadCount,
    isUserOnline,
    getUserStatusText,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ Helper function to format last seen time (EXPORTED)
export const formatLastSeen = (dateString) => {
  if (!dateString) return 'a while ago';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default SocketContext;