import { Link } from 'react-router-dom';
import { imgSrc } from '../../utils/imageUrl';

const STATUS = {
  paid:      { label: 'Ready for pickup', cls: 'bg-primary-container/15 text-primary' },
  delivered: { label: 'Collected',        cls: 'bg-secondary/15 text-secondary' },
};

function formatWhen(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function OrderCard({ order }) {
  const st = STATUS[order.status] || { label: order.status, cls: 'bg-surface text-gray-600' };
  const firstImage = order.items.find((i) => i.image_url)?.image_url;
  const summary = order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ');

  return (
    <Link
      to={`/order-success/${order.id}`}
      className="flex gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)] active:scale-[0.99]"
    >
      {firstImage ? (
        <img src={imgSrc(firstImage)} alt="" className="h-14 w-14 flex-none rounded-xl object-cover" loading="lazy" />
      ) : (
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-primary-container/10">
          <span className="material-symbols-outlined text-2xl text-primary-container">receipt_long</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold text-gray-900">{order.place_name}</h3>
          <span className="flex-none font-extrabold text-primary">₹{order.total_amount.toFixed(2)}</span>
        </div>
        <p className="truncate text-sm text-gray-600">{summary}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
          <span className="text-xs text-gray-400">#{order.id} · {formatWhen(order.created_at)}</span>
        </div>
        {order.status === 'paid' && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-base">qr_code_2</span> Tap to show your QR code
          </p>
        )}
      </div>
    </Link>
  );
}
