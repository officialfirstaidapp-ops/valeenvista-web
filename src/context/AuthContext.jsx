import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react';
import axios from 'axios';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 useEffect(() => {
  const initializeAuth = async () => {
    const token = localStorage.getItem('token');

    // Try to fetch user with existing token first
    if (token) {
      try {
        const response = await authAPI.getMe();
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
        return;
      } catch (err) {
        // ✅ Only clear tokens on real auth failures, not rate limits
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          // Rate limit or network error → keep tokens, try refresh below
          console.warn('getMe failed (non-auth error):', err.message);
        }
      }
    }

    // Try refresh cookie if no valid access token
    try {
      const response = await axios.post(
        'https://valeenvista-backend.onrender.com/api/auth/refresh',
        {},
        { withCredentials: true }
      );

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (err) {
      // ✅ Only clear if it's really an invalid refresh token
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // Rate limit → keep what we have, user stays as-is
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();
}, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data.user;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);

      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true, role: user.role };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        login,
        register,
        logout,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};