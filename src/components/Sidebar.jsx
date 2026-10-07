import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  Calendar,
  MessageCircle,
  DollarSign,
  FileText,
  LogOut,
  Settings,
  Building2,
  BarChart3,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { reservationAPI } from '../services/api';

const Sidebar = ({ userRole = 'admin' }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const { unreadCount: notifUnreadCount } = useNotifications();

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const [pendingReservations, setPendingReservations] = useState(0);

  const isClient = user?.role === 'client';

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth);
      if (width >= 180 && width <= 400) {
        setSidebarWidth(width);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const fetchNotificationCounts = async () => {
      if (!user) return;

      if (user.role === 'agent') {
        try {
          const response = await reservationAPI.getAgentReservations();
          const reservations = response.data.reservations || [];
          const pending = reservations.filter(r => r.status === 'pending').length;
          setPendingReservations(pending);
        } catch (error) {
          // Silently ignore
        }
      }
    };

    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 400) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'none';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'none';
    };
  }, [isResizing]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5000${avatarPath}`;
  };

  const isActive = (path) => {
    if (path === '/agent') {
      return location.pathname === '/agent';
    }
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path;
  };

  const navLinkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
    ${isActive(path)
      ? 'bg-white/20 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
    }
  `;

  const iconClass = (path) => `
    ${isActive(path) ? 'text-white' : 'text-white/50 group-hover:text-white'}
  `;

  const adminMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Building2, label: 'Properties', path: '/admin/properties' },
    { icon: Calendar, label: 'Reservations', path: '/admin/reservations' },
    { icon: MessageCircle, label: 'Chats', path: '/chat', badge: unreadCount },
    { icon: DollarSign, label: 'Commissions', path: '/admin/commissions' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const brokerMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/broker' },
    { icon: Building2, label: 'Properties', path: '/broker/properties' },
    { icon: Users, label: 'Agents', path: '/broker/agents' },
    { icon: Calendar, label: 'Reservations', path: '/broker/reservations', badge: pendingReservations },
    { icon: MessageCircle, label: 'Chats', path: '/chat', badge: unreadCount },
    { icon: DollarSign, label: 'Commissions', path: '/broker/commissions' },
    { icon: FileText, label: 'Reports', path: '/broker/reports' },
  ];

  const agentMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/agent' },
    { icon: Home, label: 'Properties', path: '/agent/properties' },
    { icon: Calendar, label: 'Reservations', path: '/agent/reservations', badge: pendingReservations },
    { icon: MessageCircle, label: 'Chats', path: '/chat', badge: unreadCount },
    { icon: DollarSign, label: 'Commissions', path: '/agent/commissions' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const clientMenu = [
    { icon: Calendar, label: 'My Reservations', path: '/dashboard' },
    { icon: MessageCircle, label: 'Chat', path: '/chat', badge: unreadCount },
  ];

  const getMenuByRole = () => {
    switch (userRole) {
      case 'admin': return adminMenu;
      case 'broker': return brokerMenu;
      case 'agent': return agentMenu;
      case 'client': return clientMenu;
      default: return agentMenu;
    }
  };

  const menuItems = getMenuByRole();

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }
    await logout();
    window.location.href = '/login';
  };

  const isCollapsed = sidebarWidth < 220;

  return (
    <>
      <div
        ref={sidebarRef}
        className="bg-gradient-to-b from-soft-green to-green-700 h-screen flex flex-col shadow-xl relative flex-shrink-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Header with notification badge */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="text-white flex-shrink-0" size={32} />
              {!isCollapsed && (
                <span className="text-xl font-bold text-white truncate">ValeenVista</span>
              )}
            </div>

            {notifUnreadCount > 0 && (
              <div className="relative flex-shrink-0" title={`${notifUnreadCount} unread notifications`}>
                <Bell size={18} className="text-white/80" />
                <span
                  className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-bold animate-pulse"
                >
                  {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <p className="text-white/60 text-sm mt-1">Real Estate Platform</p>
          )}
        </div>

        {!isClient && !isCollapsed && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{user?.name || 'User'}</p>
                <p className="text-white/50 text-xs capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={navLinkClass(item.path)}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon size={20} className={`${iconClass(item.path)} flex-shrink-0`} />
                  {!isCollapsed && (
                    <span className="font-medium flex-1">{item.label}</span>
                  )}
                  {item.badge > 0 && !isCollapsed && (
                    <span className="bg-rose-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.badge > 0 && isCollapsed && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px]">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} className="text-white/50 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div
        className="w-1 bg-transparent hover:bg-emerald-400 cursor-col-resize relative flex-shrink-0 transition-colors duration-200 group"
        onMouseDown={() => setIsResizing(true)}
        style={{ width: '4px', cursor: 'col-resize' }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-emerald-400 transition-colors duration-200"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;