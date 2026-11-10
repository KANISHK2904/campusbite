import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../hooks/studentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import QRTicket from '../../components/student/QRTicket';
import { imgSrc } from '../../utils/imageUrl';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [qr, setQr] = useState(null); // { status, qr_token, delivered_at }

  useEffect(() => {
    let cancelled = false;
    api(`/api/orders/${id}`)
      .then((o) => !cancelled && (setOrder(o), setStatus('ready')))
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, [id]);

  // Fetch the QR, then keep checking every 5s until the shop scans it ("Collected")
  useEffect(() => {
    let cancelled = false;
    let timer;
    const load = async () => {
      if (document.hidden) { timer = setTimeout(load, 5000); return; }
      try {
        const q = await api(`/api/orders/${id}/qr`);
        if (cancelled) return;
        setQr(q);
        if (q.status !== 'delivered') timer = setTimeout(load, 5000);
      } catch {
        if (!cancelled) timer = setTimeout(load, 10000);
      }
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id]);

  if (status === 'loading') return <LoadingSpinner full />;
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-surface">
        <EmptyState icon="error" title="Couldn't load this order" message="Your payment is safe. Go back home and check again shortly." />
      </div>
    );
  }

  const delivered = qr?.status === 'delivered';

  return (
    <main className="flex min-h-screen flex-col items-center bg-surface px-6 pb-12 pt-12 text-center">
      <span className="material-symbols-outlined text-7xl text-secondary">{delivered ? 'task_alt' : 'check_circle'}</span>
      <h1 className="mt-3 text-2xl font-extrabold text-gray-900">{delivered ? 'Order collected' : 'Order placed!'}</h1>
      <p className="mt-1 text-gray-500">Order #{order.id} · {order.place_name}</p>

      {qr?.qr_token && (
        <div className="mt-6 flex w-full justify-center">
          <QRTicket token={qr.qr_token} orderId={order.id} delivered={delivered} />
        </div>
      )}

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-left">
        <ul className="divide-y divide-outline-variant text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 items-center gap-3">
                {i.image_url ? (
                  <img src={imgSrc(i.image_url)} alt="" className="h-10 w-10 flex-none rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-container/10">
                    <span className="material-symbols-outlined text-xl text-primary-container">fastfood</span>
                  </span>
                )}
                <span className="truncate">{i.quantity} × {i.name}</span>
              </span>
              <span className="font-semibold">₹{(i.price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-outline-variant pt-3 font-extrabold">
          <span>Paid</span>
          <span>₹{order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link to="/" className="rounded-full bg-primary-container px-8 py-3 font-bold text-white">
          Back to home
        </Link>
        <Link to="/orders" className="text-sm font-semibold text-primary">
          View all my orders
        </Link>
      </div>
    </main>
  );
}
