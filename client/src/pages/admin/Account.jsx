import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useAdminApi } from '../../hooks/useApi';

export default function Account() {
  const { admin, logout } = useAdminAuth();
  const apiFetch = useAdminApi();
  const navigate = useNavigate();

  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiFetch('/api/admin/account', {
        method: 'DELETE',
        body: JSON.stringify({ password, confirm }),
      });
      logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not delete the account');
      setBusy(false);
    }
  };

  const canDelete = password.length > 0 && confirm === 'DELETE' && !busy;

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <AdminTopBar title="Admin Dashboard" />
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-margin pb-space-2xl gap-space-lg">
          <section className="flex flex-col">
            <span className="text-headline-sm text-on-surface">My account</span>
            <span className="text-body-sm text-on-surface-variant">Sign out or manage your shop account</span>
          </section>

          <section className="flex items-center gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-[28px]">storefront</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-title-md text-on-surface">{admin?.shop_name || 'Your shop'}</p>
              <p className="truncate text-body-sm text-on-surface-variant">Signed in as {admin?.username || 'admin'}</p>
            </div>
          </section>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-3.5 text-label-lg text-on-primary active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">logout</span> Log out
          </button>

          {/* Danger zone */}
          <section className="rounded-xl border border-error p-space-md">
            <div className="flex items-center gap-space-xs text-error">
              <span className="material-symbols-outlined">warning</span>
              <span className="text-title-md">Delete account</span>
            </div>

            {!showDelete ? (
              <>
                <p className="mt-space-xs text-body-sm text-on-surface-variant">
                  Permanently removes your shop, all items and photos, and every order and revenue record of your shop. This cannot be undone.
                </p>
                <button
                  onClick={() => setShowDelete(true)}
                  className="mt-space-sm w-full rounded-full border border-error px-6 py-3 text-label-lg text-error"
                >
                  Delete my account…
                </button>
              </>
            ) : (
              <form onSubmit={handleDelete} className="mt-space-sm flex flex-col gap-space-sm">
                <div className="rounded-lg bg-error-container px-space-md py-space-sm text-body-sm text-on-error-container">
                  This will permanently delete: your login, your shop, all menu items and photos, and all orders and revenue history of your shop.
                  Students will lose these orders from their history too.
                </div>

                {error && <div className="rounded-lg bg-error-container px-space-md py-space-sm text-label-md text-on-error-container">{error}</div>}

                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                  Your password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="rounded-lg bg-surface-container-low px-space-md py-3 text-body-md text-on-surface focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                  Type DELETE to confirm
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="off"
                    placeholder="DELETE"
                    className="rounded-lg bg-surface-container-low px-space-md py-3 text-body-md text-on-surface focus:outline-none"
                  />
                </label>

                <div className="flex gap-space-sm">
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setPassword(''); setConfirm(''); setError(''); }}
                    disabled={busy}
                    className="flex-1 rounded-full bg-surface-container px-6 py-3 text-label-lg text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canDelete}
                    className="flex-1 rounded-full bg-error px-6 py-3 text-label-lg text-on-error disabled:opacity-40"
                  >
                    {busy ? 'Deleting…' : 'Delete forever'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
