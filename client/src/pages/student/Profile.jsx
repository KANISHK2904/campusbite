import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../hooks/studentApi';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/common/TopBar';
import BottomNav from '../../components/common/BottomNav';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api('/api/orders/my')
      .then((res) => !cancelled && setSummary(res.summary))
      .catch(() => {}); // the numbers are a nice extra, the page works without them
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout(); // clears the login; the cart is emptied automatically when nobody is signed in
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopBar title="Profile" />
      <main className="mx-auto max-w-md px-4">
        <div className="flex flex-col items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-full" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-container text-4xl font-extrabold text-white">
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="mt-4 text-xl font-extrabold text-gray-900">{user?.name}</h2>
          <p className="mt-0.5 break-all text-sm text-gray-500">{user?.email}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orders</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{summary ? summary.order_count : '–'}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total spent</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{summary ? `₹${summary.total_spent.toFixed(2)}` : '–'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/orders')}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-semibold text-gray-900"
        >
          <span className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">receipt_long</span> My orders
          </span>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </button>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-3 font-bold text-red-700"
        >
          <span className="material-symbols-outlined">logout</span> Log out
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
