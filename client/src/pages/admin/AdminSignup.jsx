import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { publicFetch } from '../../hooks/useApi';

export default function AdminSignup() {
  const [form, setForm] = useState({ shop_name: '', username: '', password: '', confirm: '' });
  const [showPw, setShowPw]    = useState(false);
  const [showCpw, setShowCpw]  = useState(false);
  const [error, setError]      = useState('');
  const [loading, setLoading]  = useState(false);
  const { login } = useAdminAuth();
  const navigate   = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.shop_name || !form.username || !form.password) return setError('All fields are required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const data = await publicFetch('/api/auth/admin/signup', {
        method: 'POST',
        body: JSON.stringify({ username: form.username, password: form.password, shop_name: form.shop_name }),
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
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <Link to="/admin/login" className="min-w-[44px] min-h-[44px] -ml-space-xs flex items-center justify-center text-on-surface hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <h1 className="text-headline-sm text-on-surface font-bold truncate">Admin Registration</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-col w-full pb-space-2xl">
        {/* Status Banner */}
        <div className="flex items-center justify-between gap-space-sm mb-space-md">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="text-label-sm tracking-wide uppercase">Merchant Portal</span>
          </div>
          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-surface-container-high text-on-surface-variant text-label-md">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Admin Setup
          </span>
        </div>

        {/* Graphic anchor */}
        <div className="relative w-full rounded-xl bg-surface-container-lowest shadow-card p-space-md mb-space-lg overflow-hidden">
          <div className="relative z-10 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed mb-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            </div>
            <h2 className="text-headline-sm text-on-surface font-bold mb-space-xs">Register Your Counter</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Register your campus dining counter or kiosk to accept online pre-orders from students.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-fixed-dim/30 pointer-events-none" />
          <div className="absolute right-8 top-2 w-16 h-16 rounded-full bg-secondary-container/20 pointer-events-none" />
        </div>

        {/* Form card */}
        <form className="flex flex-col w-full bg-surface-container-lowest rounded-xl shadow-card p-space-md space-y-space-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-container text-on-error-container text-label-md px-space-md py-space-sm rounded-xl">{error}</div>
          )}

          {/* Shop name */}
          <div className="flex flex-col gap-space-xs">
            <label className="text-label-lg text-on-surface flex items-center justify-between" htmlFor="shop-name">
              <span>Shop name</span>
              <span className="text-label-sm text-outline">Required</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-space-md text-on-surface-variant flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">store</span>
              </div>
              <input id="shop-name" type="text" placeholder="Enter shop or outlet name" required
                value={form.shop_name} onChange={set('shop_name')}
                className="w-full h-12 pl-11 pr-space-md rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner" />
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-space-xs">
            <label className="text-label-lg text-on-surface flex items-center justify-between" htmlFor="admin-username">
              <span>Username</span>
              <span className="text-label-sm text-outline">Alphanumeric</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-space-md text-on-surface-variant flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">alternate_email</span>
              </div>
              <input id="admin-username" type="text" autoComplete="username" placeholder="Choose an admin username" required
                value={form.username} onChange={set('username')}
                className="w-full h-12 pl-11 pr-space-md rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-space-xs">
            <label className="text-label-lg text-on-surface flex items-center justify-between" htmlFor="admin-password">
              <span>Password</span>
              <span className="text-label-sm text-outline">Min. 6 chars</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-space-md text-on-surface-variant flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input id="admin-password" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a secure password" required
                value={form.password} onChange={set('password')}
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-space-sm p-space-xs text-on-surface-variant hover:text-on-surface rounded-full">
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-space-xs">
            <label className="text-label-lg text-on-surface flex items-center justify-between" htmlFor="confirm-password">
              <span>Confirm password</span>
              <span className="text-label-sm text-outline">Match above</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-space-md text-on-surface-variant flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock_clock</span>
              </div>
              <input id="confirm-password" type={showCpw ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter password" required
                value={form.confirm} onChange={set('confirm')}
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner" />
              <button type="button" onClick={() => setShowCpw(!showCpw)}
                className="absolute right-space-sm p-space-xs text-on-surface-variant hover:text-on-surface rounded-full">
                <span className="material-symbols-outlined text-[20px]">{showCpw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-start gap-space-sm p-space-sm rounded-xl bg-surface-container-low text-on-surface-variant">
            <div className="p-space-2xs rounded-lg bg-surface-container-highest text-secondary shrink-0 mt-0.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <p className="text-body-sm leading-snug">
              New shop registrations require campus administration approval before going live.
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl bg-primary-container text-on-primary text-label-lg flex items-center justify-center gap-space-xs shadow-card-md active:scale-[0.98] transition-all hover:bg-primary disabled:opacity-50">
            <span>{loading ? 'Creating account…' : 'Sign up'}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </form>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center mt-space-lg text-center gap-space-xs">
          <p className="text-body-md text-on-surface-variant">
            Already registered?{' '}
            <Link to="/admin/login" className="ml-space-xs text-label-lg text-primary hover:underline">Log in</Link>
          </p>
          <div className="flex items-center gap-space-xs text-outline mt-space-sm">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span className="text-label-sm">Campus Dining Operations</span>
          </div>
        </div>
      </div>
    </main>
  );
}
