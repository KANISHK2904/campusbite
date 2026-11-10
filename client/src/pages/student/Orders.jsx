import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../hooks/studentApi';
import TopBar from '../../components/common/TopBar';
import BottomNav from '../../components/common/BottomNav';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import OrderCard from '../../components/student/OrderCard';

const POLL_MS = 10000; // so "Ready for pickup" turns into "Collected" without a refresh

export default function Orders() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api('/api/orders/my');
        if (cancelled) return;
        setData(res);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus((s) => (s === 'ready' ? s : 'error')); // keep old data if a refresh fails
      }
    };
    load();
    const timer = setInterval(() => !document.hidden && load(), POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopBar title="My orders" />
      <main className="mx-auto max-w-md px-4">
        {status === 'loading' && <LoadingSpinner />}
        {status === 'error' && (
          <EmptyState icon="wifi_off" title="Couldn't load your orders" message="Check your connection and refresh the page." />
        )}

        {status === 'ready' && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orders</p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">{data.summary.order_count}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total spent</p>
                <p className="mt-1 text-2xl font-extrabold text-primary">₹{data.summary.total_spent.toFixed(2)}</p>
              </div>
            </div>

            {data.orders.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="No orders yet"
                message="Your paid orders will show up here."
                action={
                  <Link to="/" className="mt-6 rounded-full bg-primary-container px-6 py-2.5 font-bold text-white">
                    Browse places
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.orders.map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
