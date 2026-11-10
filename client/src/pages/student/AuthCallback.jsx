import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Landing page after Google: reads #token=..., stores it, goes Home.
export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false); // React StrictMode runs effects twice in dev

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname); // remove token from address bar
    if (!token) {
      navigate('/login?error=missing', { replace: true });
      return;
    }
    login(token).then(() => navigate('/', { replace: true }));
  }, [login, navigate]);

  return <LoadingSpinner full />;
}
