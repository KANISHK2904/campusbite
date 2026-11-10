import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import EmptyState from '../../components/common/EmptyState';
import { useAdminApi } from '../../hooks/useApi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function Dashboard() {
  const apiFetch = useAdminApi();
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders_today: 0, revenue_today: '0.00', pending_pickups: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/orders?status=paid'),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders);
    } catch { /* errors handled by apiFetch */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <AdminTopBar title="Admin Dashboard" />
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-margin pb-space-xl gap-space-md">
          {/* Outlet Status & Greeting */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm mt-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Your Outlet</span>
                <h1 className="text-headline-sm text-on-surface tracking-tight">{admin?.shop_name || 'Campus Counter'}</h1>
              </div>
              <button onClick={logout}
                className="bg-surface-container px-space-sm py-1 rounded-full flex items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="text-label-sm">Logout</span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-space-xs bg-secondary-container text-on-secondary-container px-space-sm py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                <span className="text-label-md">Counter Open · Accepting Orders</span>
              </div>
            </div>
          </div>

          {/* Scan QR Hero Card */}
          <button
            onClick={() => navigate('/admin/scan')}
            className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl p-space-md shadow-card-md flex items-center justify-between gap-space-md relative overflow-hidden active:scale-[0.99] transition-transform w-full text-left"
          >
            <div className="flex items-center gap-space-md z-10">
              <div className="w-14 h-14 rounded-xl bg-surface-container-lowest/20 backdrop-blur-md flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
              </div>
              <div className="flex flex-col">
                <span className="text-headline-sm text-on-primary">Scan QR</span>
                <span className="text-body-sm text-on-primary/90">Verify student pickup QR or token</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest/25 flex items-center justify-center text-on-primary z-10 shrink-0">
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </div>
            <div className="absolute -right-4 -bottom-6 w-28 h-28 rounded-full bg-surface-container-lowest/10 pointer-events-none" />
          </button>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-3 gap-gutter-sm">
            {/* Orders Today */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">Orders today</span>
                <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                </div>
              </div>
              <span className="text-display-lg text-on-surface leading-none mt-space-xs">{stats.orders_today}</span>
              <div className="flex items-center gap-1 mt-space-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-variant" />
                <span className="text-label-sm text-on-surface-variant">Token queue {stats.pending_pickups}</span>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">Revenue today</span>
                <div className="w-7 h-7 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                </div>
              </div>
              <span className="text-display-lg text-on-surface leading-none mt-space-xs">₹{stats.revenue_today}</span>
              <div className="flex items-center gap-1 mt-space-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-variant" />
                <span className="text-label-sm text-on-surface-variant">UPI &amp; Counter</span>
              </div>
            </div>

            {/* Pending Pickups */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">Pending pickups</span>
                <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[16px]">takeout_dining</span>
                </div>
              </div>
              <span className="text-display-lg text-on-surface leading-none mt-space-xs">{stats.pending_pickups}</span>
              <div className="flex items-center gap-1 mt-space-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-variant" />
                <span className="text-label-sm text-on-surface-variant">Awaiting shelf</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <h2 className="text-headline-sm text-on-surface">Recent Orders</h2>
                <span className="bg-surface-container-high text-on-surface-variant text-label-md px-space-sm py-0.5 rounded-full">
                  {orders.length}
                </span>
              </div>
              <button onClick={fetchData} className="text-label-md text-primary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Sync</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                icon="lunch_dining"
                title="No orders yet"
                body="New student pre-orders placed online will ring and appear here in real-time."
              />
            ) : (
              <div className="flex flex-col gap-space-sm">
                {orders.map((order) => (
                  <div key={order.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="text-title-md text-on-surface">Order #{order.id}</span>
                        <span className="w-1 h-1 rounded-full bg-surface-container-highest" />
                        <span className="text-body-sm text-on-surface-variant">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="bg-primary-fixed/50 text-on-primary-fixed-variant text-label-md px-space-sm py-0.5 rounded-full">
                        {order.status === 'paid' ? 'Pending Pickup' : order.status}
                      </span>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px] text-outline">account_circle</span>
                        <span className="text-body-sm text-on-surface-variant">{order.student_name}</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-outline">lunch_dining</span>
                        <span className="text-label-md text-on-surface">{order.items?.length || 0} items</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-title-md text-on-surface">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
