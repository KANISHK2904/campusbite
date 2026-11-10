import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ERRORS = {
  domain: 'Please sign in with your college email address.',
  unverified: 'Your Google email is not verified.',
  cancelled: 'Sign-in was cancelled.',
  state: 'Sign-in session expired. Please try again.',
  missing: 'Sign-in did not complete. Please try again.',
  server: 'Something went wrong on our side. Please try again.',
};

export default function SplashLogin() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const error = ERRORS[params.get('error')];

  if (loading) return <LoadingSpinner full />;
  if (user) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container shadow-lg">
        <span className="material-symbols-outlined text-5xl text-white">lunch_dining</span>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">CampusBite</h1>
      <p className="mt-2 max-w-xs text-gray-500">Order from campus food spots, pay online, skip the queue.</p>

      {error && (
        <p role="alert" className="mt-6 max-w-xs rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <a
        href={`${API}/api/auth/google`}
        className="mt-8 flex w-full max-w-xs items-center justify-center gap-3 rounded-full border border-outline-variant bg-surface-container-lowest px-6 py-3 font-bold text-gray-900 shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)] active:scale-[0.98]"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.6 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.4-4.8 7.1l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/>
          <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.8-6.1z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.7 2.3-6.4 0-11.7-4-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
        </svg>
        Continue with Google
      </a>
      <p className="mt-4 text-xs text-gray-400">College email accounts only</p>
    </main>
  );
}
