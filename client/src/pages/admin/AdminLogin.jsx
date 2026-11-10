import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { publicFetch } from '../../hooks/useApi';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAdminAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return setError('Both fields are required');
    setLoading(true);
    try {
      const data = await publicFetch('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      login(data.token, data.admin);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full bg-surface px-margin py-space-md min-h-screen">
      <div className="flex flex-col w-full max-w-md mx-auto space-y-space-lg py-space-xs">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-space-sm pt-space-xs">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container text-on-primary shadow-card-md">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              lunch_dining
            </span>
            <span className="absolute -top-1.5 -right-2 px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-label-sm shadow-sm tracking-wider uppercase">
              Portal
            </span>
          </div>
          <div className="flex items-center space-x-space-xs mt-space-xs">
            <span className="text-headline-md tracking-tight text-on-surface">CampusBite</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-md">
              Admin
            </span>
          </div>
          <div className="space-y-space-2xs max-w-xs">
            <h1 className="text-title-md text-on-surface">Partner &amp; Canteen Login</h1>
            <p className="text-body-sm text-on-surface-variant">
              Manage outlet orders, menu availability, and campus counter tokens.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-card space-y-space-md">
          {error && (
            <div className="bg-error-container text-on-error-container text-label-md px-space-md py-space-sm rounded-xl">
              {error}
            </div>
          )}
          <form className="space-y-space-md" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-space-2xs">
              <label className="block text-label-lg text-on-surface" htmlFor="username">Username</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">person</span>
                <input
                  id="username" type="text" autoComplete="username"
                  placeholder="Enter admin username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-body-md rounded-xl outline-none shadow-sm transition-all focus:ring-2 focus:ring-primary-container/40"
                  style={{ boxShadow: '0 0 0 1px #e1bfb5' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-space-2xs">
              <label className="block text-label-lg text-on-surface" htmlFor="password">Password</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">lock</span>
                <input
                  id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Enter password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-body-md rounded-xl outline-none shadow-sm transition-all focus:ring-2 focus:ring-primary-container/40"
                  style={{ boxShadow: '0 0 0 1px #e1bfb5' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-space-xs">
              <button
                type="submit" disabled={loading}
                className="w-full h-12 flex items-center justify-center space-x-2 rounded-2xl bg-primary-container text-on-primary text-label-lg shadow-sm transition-all active:scale-[0.98] hover:opacity-95 disabled:opacity-50"
              >
                <span>{loading ? 'Logging in…' : 'Login'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="pt-space-2xs pb-space-2xs text-center">
            <Link to="/admin/signup" className="inline-block text-label-lg text-secondary hover:text-on-secondary-container transition-colors">
              New shop? Sign up
            </Link>
          </div>
        </div>

        {/* Footer badge */}
        <div className="flex items-center justify-center space-x-1.5 px-4 py-3 rounded-xl bg-surface-container-low text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          <span className="text-label-sm tracking-wide text-center">
            Campus Dining Partner Gateway · Authorized Outlets Only
          </span>
        </div>
      </div>
    </main>
  );
}
