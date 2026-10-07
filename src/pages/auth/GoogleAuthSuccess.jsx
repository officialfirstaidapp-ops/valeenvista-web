import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error || !token) {
        navigate('/login?error=google_failed', { replace: true });
        return;
      }

      try {
        localStorage.setItem('token', token);

        const response = await api.get('/auth/me');
        const user = response.data.user;

        localStorage.setItem('user', JSON.stringify(user));

        if (updateUser) updateUser(user);

        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'broker') navigate('/broker', { replace: true });
        else if (user.role === 'agent') navigate('/agent', { replace: true });
        else navigate('/properties', { replace: true });
      } catch (err) {
        console.error('Google auth error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login?error=google_failed', { replace: true });
      }
    };

    handleAuth();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-green/30 via-pastel-yellow/20 to-pastel-orange/30">
      <div className="text-center bg-white rounded-lg shadow-xl p-8 border border-pastel-green">
        <Loader className="animate-spin text-soft-green mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-dark-text mb-2">Signing you in...</h2>
        <p className="text-light-text">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;