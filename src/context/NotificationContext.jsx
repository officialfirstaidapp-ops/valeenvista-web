import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch initial list + count
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await notificationAPI.getAll({ limit: 20 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  // Initial fetch when user is ready
  useEffect(() => {
    if (!loading && user) {
      fetchNotifications();
    } else if (!user) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, loading, fetchNotifications]);

  // Listen for live socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 30));
    };

    const handleCount = ({ count }) => {
      setUnreadCount(count);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_count', handleCount);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_count', handleCount);
    };
  }, [socket]);

  // Actions
  const markAsRead = async (id) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('markAsRead failed:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllAsRead failed:', err);
    }
  };

  const deleteOne = async (id) => {
    try {
      const res = await notificationAPI.deleteOne(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount(res.data.unreadCount ?? unreadCount);
    } catch (err) {
      console.error('deleteOne failed:', err);
    }
  };

  const clearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('clearAll failed:', err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading: loadingNotifs,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteOne,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;