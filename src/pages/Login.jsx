import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'broker') navigate('/broker', { replace: true });
      else if (user.role === 'agent') navigate('/agent', { replace: true });
      else if (user.role === 'client') navigate('/properties', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'google_failed') {
      setError('Google sign-in failed. Please try again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.role === 'admin') navigate('/admin', { replace: true });
      else if (result.role === 'broker') navigate('/broker', { replace: true });
      else if (result.role === 'agent') navigate('/agent', { replace: true });
      else if (result.role === 'client') navigate('/properties', { replace: true });
      else navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = 'https://valeenvista-backend.onrender.com/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-green/30 via-pastel-yellow/20 to-pastel-orange/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 border border-pastel-green">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Building2 className="text-soft-green" size={40} />
            <span className="text-2xl font-bold text-dark-text">ValeenVista</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-dark-text mb-2">Welcome Back</h2>
        <p className="text-center text-light-text mb-8">Sign in to your account</p>

        {error && (
          <div className="bg-pastel-orange border border-warm-orange text-dark-text px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-light-text">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-dark-text text-sm font-bold mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow bg-opacity-20"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-dark-text text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green focus:ring-1 focus:ring-soft-green bg-pastel-yellow bg-opacity-20"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text hover:text-soft-green"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-soft-green text-white py-3 px-4 rounded-lg hover:bg-warm-orange transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-light-text mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-soft-green hover:text-warm-orange font-semibold">
            Sign up
          </Link>
        </p>

        <p className="text-center text-light-text text-sm mt-4">
          Continue as{' '}
          <Link to="/" className="text-soft-green hover:text-warm-orange">
            Guest
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;