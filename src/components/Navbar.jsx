import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Search,
  MessageCircle,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Home,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  UserCircle,
  Mail,
  Phone,
  Bell
} from 'lucide-react';

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notifRef = useRef(null);
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const {
    notifications,
    unreadCount: notifUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteOne,
  } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const isClient = user?.role === 'client';
  const isAgent = user?.role === 'agent';
  const isBroker = user?.role === 'broker';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }
    await logout();
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    navigate('/login');
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `https://valeenvista-backend.onrender.com${avatarPath}`;
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch(user.role) {
      case 'admin': return '/admin';
      case 'broker': return '/broker';
      case 'agent': return '/agent';
      case 'client': return '/dashboard';
      default: return '/';
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setShowProfileMenu(false);
    navigate('/settings');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-slate-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2"></div>

          {!isAgent && !isBroker && (
            <div className="flex items-center flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search properties, locations..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="hidden md:flex items-center gap-1">
              {!isClient && !isAgent && !isBroker && (
                <Link
                  to="/properties"
                  className={`p-2 rounded-lg transition ${
                    isActiveRoute('/properties')
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                  }`}
                  title="Browse Properties"
                >
                  <Home size={20} />
                </Link>
              )}

              {/* ✅ Bell Icon with Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifPanel((v) => !v)}
                  className="relative p-2 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {notifUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                    </span>
                  )}
                </button>

                {showNotifPanel && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                        Notifications
                        {notifUnreadCount > 0 && (
                          <span className="ml-2 text-xs font-normal text-emerald-600">
                            {notifUnreadCount} new
                          </span>
                        )}
                      </h3>
                      {notifUnreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="mx-auto text-slate-300 dark:text-gray-600 mb-2" />
                          <p className="text-sm text-slate-400 dark:text-gray-500">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                              !n.is_read ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : ''
                            }`}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id);
                              if (n.link) {
                                setShowNotifPanel(false);
                                navigate(n.link);
                              }
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
                                {new Date(n.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteOne(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-500 p-1"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                            {!n.is_read && (
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/chat"
                className={`relative p-2 rounded-lg transition ${
                  isActiveRoute('/chat')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                title="Messages"
              >
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-gray-700 mx-1"></div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition group"
              >
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-emerald-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-gray-200">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    showProfileMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-1 overflow-hidden">
                  <div className="px-4 py-4 border-b border-slate-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={getAvatarUrl(user.avatar)}
                          alt={user?.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail size={12} />
                          {user?.email}
                        </p>
                        {user?.phone && (
                          <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone size={12} />
                            {user?.phone}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-full capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition w-full text-left"
                    >
                      <UserCircle size={16} className="text-slate-400" />
                      <span className="font-medium">My Profile</span>
                      <span className="ml-auto text-xs text-slate-400">View & edit</span>
                    </button>

                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition w-full text-left"
                    >
                      <Settings size={16} className="text-slate-400" />
                      <span className="font-medium">Settings</span>
                      <span className="ml-auto text-xs text-slate-400">Preferences</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-gray-700 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition w-full text-left"
                    >
                      <LogOut size={16} className="text-rose-500" />
                      <span className="font-medium">Logout</span>
                      <span className="ml-auto text-xs text-slate-400">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div ref={mobileMenuRef} className="md:hidden py-4 border-t border-slate-200 dark:border-gray-700">
            {!isAgent && !isBroker && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm text-slate-800 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-1">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                <Home size={18} className="text-slate-400" />
                Home
              </Link>
              
              {!isAgent && !isBroker && (
                <Link
                  to="/properties"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Search size={18} className="text-slate-400" />
                  Browse Properties
                </Link>
              )}
              
              {user && (
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <LayoutDashboard size={18} className="text-slate-400" />
                  Dashboard
                </Link>
              )}

              <Link
                to="/chat"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                <MessageCircle size={18} className="text-slate-400" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowNotifPanel(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition w-full text-left"
              >
                <Bell size={18} className="text-slate-400" />
                Notifications
                {notifUnreadCount > 0 && (
                  <span className="ml-auto text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    {notifUnreadCount}
                  </span>
                )}
              </button>
            </div>

            {user && (
              <div className="border-t border-slate-200 dark:border-gray-700 mt-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition w-full"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;