import { useEffect, useState } from 'react';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import EmptyState from '../../components/common/EmptyState';
import { useAdminApi } from '../../hooks/useApi';

export default function AdminOrders() {
  const apiFetch = useAdminApi();
  const [tab, setTab]           = useState('paid'); // 'paid' = pending pickup, 'delivered'
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchOrders = async (status) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/orders?status=${status}`);
      setOrders(data.orders);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(tab); }, [tab]);

  const switchTab = (t) => { setTab(t); };

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <AdminTopBar title="Admin Dashboard" />
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-space-md py-space-sm gap-space-md">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[18px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
              <span className="text-label-md text-on-surface">Orders</span>
            </div>
            <div className="flex items-center gap-space-xs bg-secondary-container px-space-sm py-1 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-label-sm text-on-secondary-container tracking-wide font-bold">LIVE</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex w-full bg-surface-container-high p-1 rounded-xl shadow-inner" role="tablist">
            <button
              role="tab" aria-selected={tab === 'paid'}
              onClick={() => switchTab('paid')}
              className={`flex-1 py-2 rounded-lg text-label-lg transition-all flex items-center justify-center gap-space-xs
                ${tab === 'paid' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab === 'paid' ? 'bg-primary-container' : 'bg-transparent'}`} />
              <span>Pending ({tab === 'paid' ? orders.length : '…'})</span>
            </button>
            <button
              role="tab" aria-selected={tab === 'delivered'}
              onClick={() => switchTab('delivered')}
              className={`flex-1 py-2 rounded-lg text-label-lg transition-all flex items-center justify-center gap-space-xs
                ${tab === 'delivered' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab === 'delivered' ? 'bg-secondary' : 'bg-transparent'}`} />
              <span>Delivered ({tab === 'delivered' ? orders.length : '…'})</span>
            </button>
          </div>

          {/* Orders list or empty */}
          {loading ? (
            <div className="flex items-center justify-center py-space-2xl">
              <span className="material-symbols-outlined text-primary-container animate-spin text-[32px]">progress_activity</span>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={tab === 'paid' ? 'dinner_dining' : 'task_alt'}
              title={tab === 'paid' ? 'No orders yet' : 'No delivered orders in history yet'}
              body={tab === 'paid'
                ? 'Incoming student pre-orders will appear here in real-time once placed.'
                : 'Completed and picked-up food vouchers will archive cleanly right here.'}
            />
          ) : (
            <div className="flex flex-col gap-space-sm">
              {orders.map((order) => (
                <div key={order.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-md">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-space-xs">
                        <span className="text-headline-sm text-on-surface">#{order.id}</span>
                        <span className={`px-space-xs py-0.5 rounded-full text-label-sm
                          ${order.status === 'paid' ? 'bg-primary-fixed/50 text-on-primary-fixed-variant' : 'bg-secondary-container text-on-secondary-container'}`}>
                          {order.status === 'paid' ? 'Pending Pickup' : 'Delivered'}
                        </span>
                      </div>
                      <span className="text-body-sm text-on-surface-variant">
                        {new Date(order.created_at).toLocaleDateString()} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-headline-sm text-on-surface">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      <span className="text-label-sm text-on-surface-variant">Paid</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[18px] text-outline">account_circle</span>
                      <span className="text-body-md text-on-surface-variant">{order.student_name}</span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-outline">lunch_dining</span>
                      <span className="text-label-md text-on-surface">{order.items?.length || 0} items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
